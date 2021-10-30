FROM node:latest AS BUILD_IMAGE


WORKDIR /src

COPY ["package.json", "package-lock.json*", "./"]

ARG mode="prods"


RUN if [ "${mode}" = "dev" ] ; then npm install ; else npm install --production ; fi


EXPOSE 3000

COPY . /src

FROM node:17-alpine
CMD if [ "$mode" = "dev" ] ; then npm run debug ; else npm run start ; fi
