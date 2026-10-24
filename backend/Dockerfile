# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cache dependencies separately from the sources.
COPY pom.xml ./
RUN mvn -B -ntp -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -ntp -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S sfd && adduser -S sfd -G sfd
WORKDIR /app
COPY --from=build /build/target/core-banking-sfd-lite-*.jar /app/app.jar

USER sfd
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
