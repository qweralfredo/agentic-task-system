.PHONY: build test lint tidy docker-build

MODULE=github.com/qweralfredo/agentic-task-system/devlake-pandora-plugin
IMAGE=pandora-devlake-plugin

build:
	go build -o bin/pandora-plugin ./cmd/...

test:
	go test ./... -v -coverprofile=coverage.out -covermode=atomic
	go tool cover -func=coverage.out | tail -1

coverage:
	go tool cover -html=coverage.out -o coverage.html

lint:
	go vet ./...

tidy:
	go mod tidy

docker-build:
	docker build -t $(IMAGE):latest .

clean:
	rm -f bin/pandora-plugin coverage.out coverage.html
