import logging
import tempfile
from typing import List

import docx2txt
from django.core.files.uploadedfile import UploadedFile
from pypdf import PdfReader

from ai_engine.services.vector_store import upsert_documents

logger = logging.getLogger(__name__)


def extract_text_from_file(file: UploadedFile) -> str:
    name = file.name.lower()
    try:
        if name.endswith('.pdf'):
            file.seek(0)
            reader = PdfReader(file)
            return '\n'.join([p.extract_text() or '' for p in reader.pages])
        if name.endswith('.docx'):
            file.seek(0)
            with tempfile.NamedTemporaryFile(suffix='.docx') as tmp:
                tmp.write(file.read())
                tmp.flush()
                return docx2txt.process(tmp.name) or ''
    except Exception:
        logger.exception('Failed to parse uploaded file %s', file.name)
        raise
    raise ValueError('Only PDF and DOCX files are supported.')


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 120) -> List[str]:
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start = max(0, end - overlap)
    return chunks


def index_resume(user_id: int, resume_id: int, text: str) -> None:
    chunks = chunk_text(text)
    metadata = [{'user_id': user_id, 'source': 'resume', 'resume_id': resume_id, 'idx': i} for i in range(len(chunks))]
    ids = [f'resume-{resume_id}-{i}' for i in range(len(chunks))]
    upsert_documents(ids=ids, documents=chunks, metadatas=metadata)
