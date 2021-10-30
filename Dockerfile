FROM node:latest AS BUILD_IMAGE
FROM ubuntu:latest AS BUILD_IMAGE
FROM node:17-alpine


WORKDIR /src

COPY ["package.json", "package-lock.json*", "./"]

ARG mode="prod"

RUN ls

RUN if [ "${mode}" = "dev" ] ; then npm install ; else npm install --production ; fi

EXPOSE 3000

COPY . /src

CMD if [ "$mode" = "dev" ] ; then npm run debug ; else npm run start ; fi
