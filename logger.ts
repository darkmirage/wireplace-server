import winston from 'winston';
import util from 'util';
import chalk from 'chalk';

const { format } = winston;

type Message = {
  event?: string;
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
          let { event, socket } = m;
          let output = '';
          if (m.event === 'say') {
            output = `${chalk.bold(m.line.username)}: ${chalk.blueBright(
              m.line.message
            )}`;
          } else {
            const m_ = { ...m };
            delete m_.event;
            delete m_.socket;
            output =
              Object.keys(m).length > 0
                ? util.inspect(m_, {
                    colors: true,
                    depth: 2,
                    breakLength: Infinity,
                  })
                : '';
          }
          event = event || 'general';
          switch (event) {
            case 'connection': {
              event = chalk.cyanBright(event);
              break;
            }
            case 'join': {
              event = chalk.cyanBright(event);
              break;
            }
            case 'closure': {
              event = chalk.redBright(event);
              break;
            }
          }

          socket = socket ? `[${socket.substr(0, 6)}] ` : '';

          return `${l.timestamp} [${l.level}] ${socket}[${event}] ${output}`;
        })
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
