FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

# Build-args for UID/GID alignment
ARG AGENT_UID=1001
ARG AGENT_GID=1001

RUN groupmod -g $AGENT_GID node && usermod -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

# Ensure /home/agent is owned by the agent user
RUN chown -R ${AGENT_UID}:${AGENT_GID} /home/agent

# Create opencode state directory and allow agent to write to it
RUN mkdir -p /home/agent/.local/state /home/agent/.local/share/opencode && \
    chown -R ${AGENT_UID}:${AGENT_GID} /home/agent/.local

# Install OpenCode CLI (as root before switching to agent user)
RUN npm install -g opencode-ai@latest

USER ${AGENT_UID}:${AGENT_GID}

ENV PATH="/home/agent/.local/bin:/usr/local/bin:$PATH"

WORKDIR /home/agent

ENTRYPOINT ["sleep", "infinity"]
