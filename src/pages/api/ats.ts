import type { APIRoute } from 'astro';
import OpenAI from 'openai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const openai = new OpenAI({
    apiKey: import.meta.env.OPENAI_API_KEY,
  });

  try {
    const body = await request.json();
    const { jobDescription, cvMarkdown } = body;

    if (!jobDescription || !cvMarkdown) {
      return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
    }

    const systemPrompt = `
You are an advanced Applicant Tracking System (ATS) simulation engine designed to evaluate resumes against specific job descriptions with high realism and structured scoring.

Your task is to simulate a professional ATS + Recruiter + Hiring Manager evaluation process.

You must provide:
1) Hard Requirements Matching
2) Cultural & Seniority Fit Analysis
3) ATS Keyword Alignment Assessment
4) Penalization Factors
5) Final ATS Score (0–100)
6) Realistic Interpretation of Score
7) Candidate Pool Simulation
8) Estimated Ranking Position
9) Probability of Passing Each Hiring Phase
10) Overall Probability of Interview Call
11) Strategic Recommendations

SCORING WEIGHT GUIDANCE:
- Hard Requirements Match: 50%
- Cultural & Seniority Fit: 20%
- Keyword Alignment & Tool Matching: 15%
- Technical Depth & Production Readiness: 10%
- Risk Gaps & Penalizations: -15% impact

OUTPUT FORMAT (JSON ONLY):
Return a single JSON object with this exact structure:
{
  "hard_requirements_score": number,
  "cultural_fit_score": number,
  "keyword_alignment_score": number,
  "technical_depth_score": number,
  "penalty_impact": number,
  "final_ats_score": number,
  "candidate_pool_size": number,
  "estimated_rank_position": "string",
  "tier_classification": "string",
  "probability_ats_pass": number,
  "probability_recruiter_pass": number,
  "probability_technical_pass": number,
  "probability_final_pass": number,
  "overall_interview_probability": number,
  "hard_requirements_analysis": [
    { "requirement": "string", "status": "match" | "missing" | "partial", "comment": "string" }
  ],
  "missing_keywords": ["string", "string"],
  "top_improvement_actions": ["string", "string", "string"]
}
`;

    const userPrompt = `
      EVALUATE THIS CANDIDATE:

      --- JOB DESCRIPTION ---
      ${jobDescription}

      --- CANDIDATE CV (MARKDOWN) ---
      ${cvMarkdown}
    `;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    if (!result) throw new Error('No response from AI');

    return new Response(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ATS Error:', error);
    return new Response(JSON.stringify({ error: 'Error procesando ATS', details: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
