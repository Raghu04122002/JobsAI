import json
import logging
from typing import Any, Dict, List

from django.conf import settings

from ai_engine.prompt_templates import ANALYSIS_PROMPT, CHAT_PROMPT, MATCH_PROMPT, TAILOR_PROMPT
from ai_engine.schemas import CRAGScoreResponse

from .openai_client import get_openai_client
from .vector_store import query_documents

logger = logging.getLogger(__name__)


class CRAGService:
    def __init__(self, max_retries: int = 2) -> None:
        self.max_retries = max_retries
        self.client = get_openai_client()

    def retrieve_context(self, user_id: int, question: str, top_k: int = 8) -> List[Dict[str, Any]]:
        return query_documents(user_id=user_id, query=question, top_k=top_k)

    def score_context(self, question: str, contexts: List[Dict[str, Any]]) -> CRAGScoreResponse:
        prompt = (
            'Score relevance from 1-10 for how well context answers question. '
            'Return strict JSON: {"relevance_score": int, "reasoning": "..."}.\n'
            f'Question: {question}\n'
            f'Context: {json.dumps(contexts[:5])}'
        )
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0,
                response_format={'type': 'json_object'},
                messages=[{'role': 'user', 'content': prompt}],
            )
            parsed = json.loads(response.choices[0].message.content)
            return CRAGScoreResponse(**parsed)
        except Exception:
            logger.exception('Context scoring failed, using conservative default score.')
            return CRAGScoreResponse(relevance_score=5, reasoning='Scoring failed.')

    def retry_logic(self, user_id: int, question: str, top_k: int = 8) -> List[Dict[str, Any]]:
        attempt = 0
        current_top_k = top_k
        best_context: List[Dict[str, Any]] = []
        best_score = 0

        while attempt <= self.max_retries:
            contexts = self.retrieve_context(user_id=user_id, question=question, top_k=current_top_k)
            score = self.score_context(question, contexts)
            logger.info('CRAG attempt=%s score=%s', attempt + 1, score.relevance_score)

            if score.relevance_score > best_score:
                best_score = score.relevance_score
                best_context = contexts

            if score.relevance_score >= 7:
                return contexts

            attempt += 1
            current_top_k = min(current_top_k + 4, 20)

        return best_context

    def generate_answer(self, question: str, contexts: List[Dict[str, Any]], mode: str = 'analysis') -> Dict[str, Any]:
        system_prompt = ANALYSIS_PROMPT if mode == 'analysis' else CHAT_PROMPT
        if mode == 'tailor':
            system_prompt = TAILOR_PROMPT

        if not contexts:
            return {
                'missing_keywords': [],
                'improvement_suggestions': ['Could not retrieve enough context. Upload resume and jobs first.'],
                'rewritten_bullets': [],
            }

        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.3,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': json.dumps({'question': question, 'contexts': contexts[:12]})},
                ],
            )
            payload = json.loads(response.choices[0].message.content)
            if mode == 'analysis':
                payload.setdefault('missing_keywords', [])
                payload.setdefault('improvement_suggestions', [])
                payload.setdefault('rewritten_bullets', [])
            if mode == 'chat':
                payload.setdefault('answer', 'I could not produce a complete answer. Please try again.')
            return payload
        except Exception:
            logger.exception('Answer generation failed.')
            if mode == 'analysis':
                return {
                    'missing_keywords': [],
                    'improvement_suggestions': ['Generation failed. Try again with a more specific query.'],
                    'rewritten_bullets': [],
                }
            if mode == 'tailor':
                return {
                    'tailored_bullets': [],
                    'cover_letter': 'Generation failed. Please retry.',
                }
            return {'answer': 'Generation failed. Please retry.'}

    def match_resume_job(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        payload = {'resume_text': resume_text[:14000], 'job_text': job_text[:14000]}
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.2,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': MATCH_PROMPT},
                    {'role': 'user', 'content': json.dumps(payload)},
                ],
            )
            data = json.loads(response.choices[0].message.content)
            data.setdefault('match_score', 0)
            data.setdefault('ats_score', data.get('match_score', 0))  # Backwards compatibility
            data.setdefault('matched_keywords', [])
            data.setdefault('missing_keywords', [])
            data.setdefault('skill_gaps', [])
            data.setdefault('improvement_suggestions', [])
            data.setdefault('tailored_resume_bullets', [])
            data.setdefault('cover_letter_snippet', '')
            return data
        except Exception:
            logger.exception('Resume/job match generation failed.')
            return {
                'match_score': 0,
                'ats_score': 0,
                'matched_keywords': [],
                'missing_keywords': [],
                'skill_gaps': [],
                'improvement_suggestions': ['Matching failed. Please retry.'],
                'tailored_resume_bullets': [],
                'cover_letter_snippet': '',
            }

    def tailor_resume_job(self, resume_text: str, job_text: str) -> Dict[str, Any]:
        """
        Generates tailored bullets and cover letter using specific resume and job text.
        Bypasses retrieval logic.
        """
        payload = {'resume_text': resume_text[:12000], 'job_text': job_text[:12000]}
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                temperature=0.4,
                response_format={'type': 'json_object'},
                messages=[
                    {'role': 'system', 'content': TAILOR_PROMPT},
                    {'role': 'user', 'content': json.dumps(payload)},
                ],
            )
            data = json.loads(response.choices[0].message.content)
            data.setdefault('tailored_bullets', [])
            data.setdefault('cover_letter', '')
            return data
        except Exception:
            logger.exception('Tailoring failed.')
            return {
                'tailored_bullets': [],
                'cover_letter': 'Generation failed. Please retry.',
            }
