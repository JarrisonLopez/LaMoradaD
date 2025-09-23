import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PodcastEpisode } from '../entities/podcast-episode.entity';
import { User } from '../entities/user.entity';
import { PodcastsService } from './podcasts.service';
import { PodcastsController } from './podcasts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PodcastEpisode, User])],
  providers: [PodcastsService],
  controllers: [PodcastsController],
  exports: [PodcastsService],
})
export class PodcastsModule {}
