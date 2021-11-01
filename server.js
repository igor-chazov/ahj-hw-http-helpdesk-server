const http = require('http');
const uuid = require('uuid');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();

const tickets = [];

class Tickets {
  constructor(id, name, description, status, created) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.status = status;
    this.created = created;
  }
}

const firstTicket = new Tickets(uuid.v4(), 'Поменять краску в притере, ком. 404', 'Принтер HP LJ 1210, катриджи на складе', true, new Date());
const secondTicket = new Tickets(uuid.v4(), 'установить обровление KB-1245', 'Пришло критическое обновление для Windows, нужно поставить обновление в следующем приоритете:\n 1. Сервера (незабыть сделать бэкап!)\n 2. Рабочие станции', false, new Date());
tickets.push(firstTicket);
tickets.push(secondTicket);

app.use(koaBody({
  urlencoded: true,
  multipart: true,
  text: true,
  json: true,
}));

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*' };

  if (ctx.request.method === 'OPTIONS') {
    ctx.response.set({ ...headers });
  }

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});


app.use(async ctx => {
  const { method, id } = ctx.request.query;
  const { name, description, status } = ctx.request.body;

  switch (method) {
    case 'allTickets':
      ctx.response.body = tickets.map((item) => {
        return {
          id: item.id,
          name: item.name,
          status: item.status,
          created: item.created,
        };
      });
      break;
    case 'ticketById':
      if (id) {
        const ticket = tickets.find((item) => item.id === id);
        if (ticket) {
          ctx.response.body = ticket;
        } else {
          ctx.response.status = 404;
        }
      }
      break;
    case 'createTicket':
      const newId = uuid.v4();
      const created = new Date();
      tickets.push(new Tickets(newId, name, description, false, created));
      ctx.response.body = tickets;
      break;
    case 'removeById':
      const index = tickets.findIndex((item) => item.id === id);
      tickets.splice(index, 1);
      ctx.response.body = true;
      break;
    case 'editTicket':
      if (id) {
        const index = tickets.findIndex((item) => item.id === id);
        tickets[index].name = name;
        tickets[index].description = description;
      }
      ctx.response.body = true;
      break;
    case 'checkTicket':
      if (id) {
        const index = tickets.findIndex((item) => item.id === id);
        tickets[index].status = status;
      }
      ctx.response.body = true;
      break;
    default:
      ctx.response.status = 404;
      break;
  }
});

const server = http.createServer(app.callback());
const port = process.env.PORT || 7070;
server.listen(port, () => console.log('Server started'));