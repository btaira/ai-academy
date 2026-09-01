# Serves the same static site the GitHub Pages workflow deploys:
# src/ai-academy.html as the site root, src/papers/ alongside it.
# See .github/workflows/pages.yml for the canonical build step this mirrors.
FROM nginx:alpine

RUN sed -i 's/listen\s*80;/listen 8082;/' /etc/nginx/conf.d/default.conf

COPY src/ai-academy.html /usr/share/nginx/html/index.html
COPY src/papers /usr/share/nginx/html/papers

EXPOSE 8082
