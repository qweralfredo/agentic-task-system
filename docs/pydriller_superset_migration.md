# Plano de Migração: DevLake + Grafana para Pydriller + Superset

Este épico visa substituir toda a infraestrutura "pesada" do Apache DevLake e Grafana por uma solução analítica in-house leve e altamente flexível, composta por um ETL próprio em Python (Pydriller) e visualização de dados via Apache Superset integrados diretamente ao banco do Pandora.

## 📌 Motivação
- **Redução extrema de recursos**: Remover os 5+ containers do DevLake (MySQL próprio, UI, Core, Temporal, etc).
- **Sem conflitos de ambiente**: Evitar CRLF, proxies complexos e limitação de schemas pré-moldados.
- **Integração Nativa**: Enviar os dados direto para o PostgreSQL já existente do seu sistema Pandora.
- **Customização Total (Superset)**: Criação de SQL Dashboards ultra rápidos conectando os dados de Inteligência Artificial (Agent Runs) com Git Analytics num só lugar.

## 🗺️ Fases e Tarefas (Pandora Atomic Flow)

### Phase 1: Limpeza e Preparação de Infraestrutura
1. **Remover DevLake e Grafana do Root Compose**: Fazer o *clean-up* do `docker-compose.yml`, eliminando os profiles `devlake`, e apagar o volume e pastas antigas em `ops/devlake`.
2. **Setup do Apache Superset**: Adicionar o profile e container do Superset (`apache/superset`) ao `docker-compose.yml` utilizando o próprio `pandora-postgres` (ou um banco novo leve) como metadata backend e fonte de dados.
3. **Provisionamento do Superset**: Criar um script inicial `superset-init.sh` para rodar o setup do admin (`superset fab create-admin`), migrações (`superset db upgrade`) e inicialização automatizada.

### Phase 2: Desenvolvimento do Pandora Git Miner (Pydriller)
1. **Estruturar o Worker**: Criar um diretório `ops/git-miner` com o `Dockerfile` voltado para Python 3.11-alpine, instalando `pydriller`, `psycopg2` e `schedule`.
2. **Setup do Banco (Schema)**: Definir a tabela `pandora_git_metrics` (hash, autor, add/del, date, msg, dora_tags) diretamente no init-scripts ou via EF Core dentro do Pandora API.
3. **Escrever o ETL (miner.py)**: Utilizar o Pydriller para scanear o repositório atual (ou do Github) a cada X minutos e sincronizar com o PostgreSQL.
4. **Adicionar o Miner ao Docker Compose**: Conectar o container `git-miner` a mesma rede do Postgres.

### Phase 3: Dashboards no Apache Superset
1. **Conectar banco nativo**: Configurar o source `pandora-postgres` no Superset.
2. **Criar Datasets Analíticos**: Importar as coleções de *Commits*, *Agent Runs* e *Knowledge Checkpoints*.
3. **Dashboards DORA & Agent Tracker**: Reconstruir gráficos de Linhas Adicionadas por Agent, Tempo de Resolução de Task e Frequência de Deploy.

---
## 🎯 Critérios de Aceite
- `docker compose up -d` deve levantar Superset e o Git Miner sem dar falhas e ocupando menos da metade da RAM do Devlake.
- A interface do Superset deve estar acessível (ex: porta `8088`).
- Novos commits feitos no repo devem aparecer nas tabelas do Superset em até n minutos.
