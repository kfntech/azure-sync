FROM mcr.microsoft.com/mssql-tools

RUN apt-get update -yq \
    && apt-get install openssh-client curl gnupg -yq \
    && curl -sL https://deb.nodesource.com/setup_12.x | bash \
    && apt-get install nodejs -yq

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Specify port app runs on
# EXPOSE 3000

# Run the app
ENTRYPOINT [ "node",  "./dist/index.js" ]
