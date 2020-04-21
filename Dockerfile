FROM ubuntu:16.04

RUN mkdir /www

COPY . /www

WORKDIR /www/bin
RUN apt-get update
RUN apt-get install -y openjdk-8-jre software-properties-common
RUN adduser --disabled-password user
RUN chown -R user /www

EXPOSE 9200
EXPOSE 9300

CMD ["su", "-m", "user", "-c", "./elasticsearch --network.host _non_loopback_"]

