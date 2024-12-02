import winston from 'winston';

const logFormat = winston.format.printf(({ level, message, timestamp, context }) => {
  return `${timestamp} [${context}] ${level}: ${message}`;
});

export const createLogger = (context: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      logFormat
    ),
    defaultMeta: { context },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        )
      }),
      new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error',
        format: winston.format.combine(
          winston.format.uncolorize(),
          logFormat
        )
      }),
      new winston.transports.File({ 
        filename: 'combined.log',
        format: winston.format.combine(
          winston.format.uncolorize(),
          logFormat
        )
      })
    ]
  });
};
