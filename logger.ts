import winston from 'winston';
import util from 'util';
import chalk from 'chalk';

const { format } = winston;

type Message = {
  receiver?: string;
  procedure?: string;
  socket?: string;
  line: any;
};

const logger = winston.createLogger({
  level: 'info',
  format: format.timestamp(),
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf((l) => {
          const m: any = l.message;
          let output = '';
          if (m.receiver === 'say') {
            output = `[${chalk.bold(m.line.username)}] ${chalk.blueBright(
              m.line.message
            )}`;
          } else {
            output = util.inspect(m, {
              colors: true,
              depth: 2,
              breakLength: Infinity,
            });
          }

          return `${l.timestamp} [${l.level}] ${output}`;
        }),
        format.align()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: format.json(),
    }),
  ],
});

export default logger;
