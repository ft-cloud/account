FROM node:latest


WORKDIR /src

COPY ["package.json", "package-lock.json*", "./"]

ARG mode="prods"


RUN if [ "${mode}" = "dev" ] ; then npm install ; else npm install --production ; fi


EXPOSE 3000

COPY . /src


CMD if [ "$mode" = "dev" ] ; then npm run debug ; else npm run start ; fi
