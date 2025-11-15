import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MoviesService } from '../modules/movies/movies.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const moviesService = app.get(MoviesService);

  console.log('🚀 Starting to populate database from TMDB...');
  
  try {
    const result = await moviesService.syncFromTMDB(10); // Fetch 10 pages (200 movies)
    console.log(`✅ Database population completed!`);
    console.log(`📊 Imported: ${result.imported} movies`);
    console.log(`⏩ Skipped: ${result.skipped} movies`);
  } catch (error) {
    console.error('❌ Error populating database:', error);
  }

  await app.close();
}

bootstrap();