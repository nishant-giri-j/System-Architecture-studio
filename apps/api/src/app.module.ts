import { Module } from "@nestjs/common";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { GraphQLModule } from "@nestjs/graphql";
import { HealthResolver } from "./health.resolver";
import { HealthController } from "./health.controller";
import { DiagramGateway } from "./diagram.gateway";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthResolver, DiagramGateway],
})
export class AppModule {}
