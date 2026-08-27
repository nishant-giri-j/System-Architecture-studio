import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? true;
  const app = await NestFactory.create(AppModule, { cors: { origin: corsOrigin } });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
