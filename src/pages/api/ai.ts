import type { APIRoute } from "astro";
import OpenAI from "openai";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const deepseek = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: import.meta.env.DEEPSEEK_API_KEY,
  });

  try {
    const body = await request.json();
    const { action, cvData, jobDescription, lang } = body;
    const targetLang = lang === "es" ? "Español" : "Inglés";

    // --- SYSTEM PROMPT (El "Cerebro") ---
    const systemPrompt = `
      Eres un Coach de Carrera Senior y Experto en Redacción de CVs de alto impacto.
      Tu objetivo es transformar currículums promedio en documentos de nivel ejecutivo/senior.

      REGLAS ABSOLUTAS DE SALIDA:
      1. Debes devolver EXACTAMENTE la misma estructura JSON que recibes. No cambies nombres de claves.
      2. MANTÉN INTACTOS: IDs, Fechas, Emails, Teléfonos, URLs, Nombres de empresas y Universidades (a menos que sea traducción).
      3. Solo devuelve el JSON. Nada de texto antes ni después.
      
      ESTRATEGIA DE MEJORA:
      - SUMMARY: Hazlo narrativo, enfocado en valor aportado y seniority.
      - EXPERIENCIA: Usa verbos de acción fuertes (Lideré, Arquitecté, Optimicé). Aplica el método STAR (Situación, Tarea, Acción, Resultado) en los bullets siempre que sea posible. Cuantifica logros (ej: "reduje costos un 20%").
      - SKILLS: Estandariza la terminología técnica.
    `;

    let userPrompt = "";

    // --- PROMPTS ESPECÍFICOS ---

    if (action === "enhance") {
      userPrompt = `
        Toma este JSON de un CV y mejora PROFUNDAMENTE la redacción de TODO el contenido al idioma ${targetLang}.

        INSTRUCCIONES POR SECCIÓN:
        1. **Personal.role**: Hazlo sonar más senior si es apropiado.
        2. **Personal.summary**: Reescríbelo para que sea un "Elevator Pitch" persuasivo de 3-4 líneas.
        3. **Experience.description**: REESCRIBE CADA PUNTO (Bullet). No solo corrijas gramática. Transforma tareas pasivas ("Encargado de...") en logros activos ("Incrementé la eficiencia mediante...").
        4. **Skills**: Reorganiza o corrige nombres de tecnologías si están mal escritos.
        
        JSON DEL CV:
        ${JSON.stringify(cvData)}
      `;
    } else if (action === "translate") {
      userPrompt = `
        Traduce TODO el contenido textual de este CV al ${targetLang}.
        
        QUÉ TRADUCIR:
        - Roles y Títulos profesionales.
        - Resumen profesional (Summary).
        - Todas las descripciones de experiencia (Descriptions).
        - Categorías de habilidades (Skill Categories).
        - Nombres de grados académicos (Degree).
        - Ciudad/País (si tienen traducción común).
        
        QUÉ NO TRADUCIR:
        - Nombres propios (Personas, Empresas, Universidades).
        - Nombres de tecnologías universales (Python, SQL, Azure, Cloud, etc).

        JSON DEL CV:
        ${JSON.stringify(cvData)}
      `;
    } else if (action === "optimize") {
      userPrompt = `
        Actúa como un sistema ATS (Applicant Tracking System) inteligente.
        Optimiza este CV para asegurar que pase los filtros para la siguiente Descripción de Trabajo.

        JOB DESCRIPTION:
        "${jobDescription}"

        ACCIONES REQUERIDAS:
        1. **Keywords**: Inyecta palabras clave de la oferta en el 'Summary' y en las 'Skills' de forma natural.
        2. **Experience**: Reescribe los puntos de experiencia para resaltar las habilidades que pide la oferta. Si la oferta pide "Liderazgo", enfatiza el liderazgo en la experiencia existente.
        3. **Alineación**: Asegúrate de que el 'Role' del perfil coincida o se alinee con el título de la vacante.
        
        Idioma de salida: ${targetLang}.

        JSON DEL CV:
        ${JSON.stringify(cvData)}
      `;
    } else if (action === "evaluate_match") {
      userPrompt = `
        Actúa como un Reclutador Senior Técnico.
        Tu tarea es evaluar si este candidato encaja en la vacante proporcionada.

        VACANTE:
        "${jobDescription}"

        CANDIDATO (CV Data):
        ${JSON.stringify(cvData)}

        SALIDA REQUERIDA (JSON):
        {
            "matchScore": number (0-100),
            "summary": "Breve explicación de 2-10 líneas",
            "pros": ["Punto fuerte 1", "Punto fuerte 2", ...],
            "cons": ["Falta X habilidad", "Experiencia insuficiente en Y", ...],
            "recommendation": "Entrevistar" | "Descartar" | "Mantener en reserva"
        }
      `;
    }

    // --- LLAMADA A LA API ---
    const completion = await deepseek.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "deepseek-chat",
      temperature: 1.1, // Subimos un poco la creatividad para que reescriba mejor
      max_tokens: 4000, // Aseguramos espacio suficiente para todo el JSON
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;

    if (!result) throw new Error("No response from AI");

    const jsonResponse = JSON.parse(result);

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(
      JSON.stringify({ error: "Error procesando IA", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
