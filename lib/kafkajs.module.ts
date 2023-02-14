import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { Kafka } from 'kafkajs';
import {
  KAFKA_DEFAULT_BROKER,
  KAFKA_DEFAULT_CLIENT,
  KAFKA_MODULE_OPTIONS,
  KAFKA_PRODUCER,
} from './constants';
import { EventSubscribersLoader } from './event-subscribers.loader';
import { EventsMetadataAccessor } from './events-metadata.accessor';
import { KafkaModuleOptions, KafkaProviderAsyncOptions } from './interfaces';
import { KafkaConnection } from './kafka-connection';

@Module({})
export class KafkajsModule {
  static forRootAsync(options: KafkaProviderAsyncOptions): DynamicModule {
    return {
      global: true,
      module: KafkajsModule,
      imports: [DiscoveryModule],
      providers: [
        EventsMetadataAccessor,
        ...this.createAsyncProviders(options),
        ...(options.extraProviders || []),
        {
          provide: Kafka,
          useFactory: (kafkaModuleOptions: KafkaModuleOptions) => {
            return new Kafka(
              Object.assign(kafkaModuleOptions.client || {}, {
                clientId:
                  kafkaModuleOptions.client.clientId || KAFKA_DEFAULT_CLIENT,
                brokers:
                  kafkaModuleOptions.client.brokers || KAFKA_DEFAULT_BROKER,
              }),
            );
          },
          inject: [KAFKA_MODULE_OPTIONS],
        },
        {
          provide: KAFKA_PRODUCER,
          useFactory: (kafka: Kafka, kafkaModuleOptions: KafkaModuleOptions) =>
            kafka.producer(kafkaModuleOptions.producer),
          inject: [Kafka, KAFKA_MODULE_OPTIONS],
        },
        EventSubscribersLoader,
        KafkaConnection,
      ],
      exports: [KafkaConnection],
    };
  }

  private static createAsyncProviders(
    options: KafkaProviderAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: KafkaProviderAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: KAFKA_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const clientOptions = await options.useFactory(...args);
          return clientOptions;
        },
        inject: options.inject || [],
      };
    }
    return {
      provide: KAFKA_MODULE_OPTIONS,
      useFactory: async (...args: any[]) => {
        const clientOptions = await options.useFactory(...args);
        return clientOptions;
      },
      inject: [options.useExisting || options.useClass],
    };
  }
}
