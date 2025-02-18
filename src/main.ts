import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { config } from 'aws-sdk';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();


  // protect from well-known web vulnerabilities
  app.use(helmet());
  

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    // whitelist:true
  }));

  // setting up s3
  const configService = app.get(ConfigService);
  config.update({
    accessKeyId: configService.get('S3_ACCESS_KEY_ID'),
    secretAccessKey: configService.get('S3_SECRET_ACCESS_KEY'),
    region: configService.get('AWS_REGION'),
  });


  // for swagger
  // const swagger_config = new DocumentBuilder()
  //   .setTitle('Dibsy API Doc')
  //   .setDescription('Dibsy API Doc')
  //   .setVersion('1.0')
  //   .addTag('api')
  //   .build();
  // const document = SwaggerModule.createDocument(app, swagger_config);
  // SwaggerModule.setup('swagger', app, document);

  // try to update the timezone
  //process.env.TZ = "Asia/Qatar";

  await app.listen(configService.get("SERVER_PORT") || 5000);
}
bootstrap();
