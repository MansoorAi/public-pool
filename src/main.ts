import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as bitcoinjs from 'bitcoinjs-lib';
import { useContainer } from 'class-validator';
import { readFileSync } from 'fs';
import * as ecc from 'tiny-secp256k1';

import { AppModule } from './app.module';

async function bootstrap() {

  if (process.env.PORT == null) {
    console.error('It appears your environment is not configured, create and populate an .env file.');
    return;
  }

  let options = {};
  const secure = process.env.API_SECURE?.toLowerCase() == 'true';
  if (secure) {

    const httpsOptions = {
      key: readFileSync('./secrets/key.pem'),
      cert: readFileSync('./secrets/cert.pem'),
    };

    options = { https: httpsOptions };

  } else {

  }

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(options));
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true
    }),
  );
  app.enableCors();
  useContainer(app.select(AppModule), { fallbackOnErrors: true });


  //Taproot
  bitcoinjs.initEccLib(ecc);

  await app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`${secure ? 'https' : 'http'} listening on port ${process.env.PORT}`);
  });

}
bootstrap();
