import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import {
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  KafkaConfig,
  ProducerConfig,
} from 'kafkajs';

export interface KafkaModuleOptions {
  client?: KafkaConfig;
  consumer?: ConsumerConfig;
  run?: Omit<ConsumerRunConfig, 'eachBatch' | 'eachMessage'>;
  producer?: ProducerConfig;
  subscribe?: Omit<ConsumerSubscribeTopics, 'topics'>;
}

export interface KafkaModuleOptionsFactory {
  createKafkaOptions(): Promise<KafkaModuleOptions>;
}

export interface KafkaProviderAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<KafkaModuleOptionsFactory>;
  useClass?: Type<KafkaModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<KafkaModuleOptions> | KafkaModuleOptions;
  inject?: any[];
  extraProviders?: Provider[];
}
