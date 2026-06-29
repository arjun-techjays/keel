# Build context = repo root (so we can bundle the pinned checks/ + constitution.md).
FROM python:3.11-slim

WORKDIR /app

# System deps for the render pipeline (app/render.py): pandoc (md→.docx), the d2
# binary + librsvg (d2→SVG→PNG, browserless), and mermaid-cli (mmdc) with a SYSTEM
# Chromium for Puppeteer. Diagrams render with these LOCAL binaries only — source is
# NEVER sent to a public service. (d2's own PNG export is avoided on purpose: it pulls
# a Playwright Chromium and crashes as root in a container — rsvg-convert has no such
# issue, and the apt Chromium is needed for mermaid regardless.)
ARG D2_VERSION=0.6.9
ARG MERMAID_CLI_VERSION=10.9.1
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    CHROME_PATH=/usr/bin/chromium \
    KEEL_MMDC_NO_SANDBOX=1
RUN apt-get update && apt-get install -y --no-install-recommends \
        pandoc nodejs npm chromium fonts-liberation librsvg2-bin curl ca-certificates tar \
    && npm install -g "@mermaid-js/mermaid-cli@${MERMAID_CLI_VERSION}" \
    && ARCH="$(dpkg --print-architecture)" \
    && curl -fsSL "https://github.com/terrastruct/d2/releases/download/v${D2_VERSION}/d2-v${D2_VERSION}-linux-${ARCH}.tar.gz" -o /tmp/d2.tgz \
    && tar -xzf /tmp/d2.tgz -C /tmp \
    && mv "/tmp/d2-v${D2_VERSION}/bin/d2" /usr/local/bin/d2 \
    && chmod +x /usr/local/bin/d2 \
    && rm -rf /tmp/d2* /var/lib/apt/lists/*

COPY service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY service/ ./service/
COPY checks/ ./checks/
COPY constitution.md ./constitution.md
# Branding assets (repo-root assets/branding/, built in parallel): the pandoc reference
# .docx AND the cover logo (techjays-logo.png, which the render route picks up beside the
# reference doc). Bundled so the route emits branded output with a cover. If
# assets/branding/ is ever absent at build time, comment this out — the route degrades to
# unbranded / no-logo (it checks os.path.exists on the reference doc and the logo).
COPY assets/branding/ ./assets/branding/

ENV CHECKS_DIR=/app/checks \
    CONSTITUTION_PATH=/app/constitution.md \
    REFERENCE_DOC_PATH=/app/assets/branding/techjays-reference.docx \
    PORT=8000

# --forwarded-allow-ips '*' so uvicorn trusts Railway's X-Forwarded-Proto and
# emits https (not http) redirects — otherwise the /mcp -> /mcp/ redirect
# downgrades scheme and MCP clients drop the Authorization header.
CMD ["sh", "-c", "uvicorn service.app.main:app --host 0.0.0.0 --port ${PORT:-8000} --forwarded-allow-ips '*'"]
