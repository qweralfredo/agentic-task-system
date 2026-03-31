FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod ./
RUN go mod download 2>/dev/null || true

COPY . .
RUN go build -o /pandora-plugin ./...

# ---- runtime ----
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /pandora-plugin /usr/local/bin/pandora-plugin

ENV PANDORA_API_URL=http://pandora-api:5000 \
    DEVLAKE_URL=http://devlake:8080 \
    DEVLAKE_WEBHOOK_ID=1 \
    PANDORA_PROJECT_ID="" \
    POLL_INTERVAL_SEC=300

ENTRYPOINT ["/usr/local/bin/pandora-plugin"]
