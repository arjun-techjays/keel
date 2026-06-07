# Build context = repo root (so we can bundle the pinned checks/ + constitution.md).
FROM python:3.11-slim

WORKDIR /app

COPY service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY service/ ./service/
COPY checks/ ./checks/
COPY constitution.md ./constitution.md

ENV CHECKS_DIR=/app/checks \
    CONSTITUTION_PATH=/app/constitution.md \
    PORT=8000

CMD ["sh", "-c", "uvicorn service.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
