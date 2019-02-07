import '@types/express';

declare global {
    namespace Clout {
        interface Request extends CloutRequest { }
        interface Response extends CloutResponse { }
        interface Application extends CloutApplication { }
    }
}

export interface CloutApplication extends Object {

}

export interface CloutRequest extends Express.Request {
    clout: CloutApplication;
}

export interface CloutResponse extends Express.Response {
    ok(body: any);
    success(body: any);
    created(body: any);
    accepted(body: any);
    badRequest(body: any);
    notFound(body: any);
    error(body: any);
    unauthorized(body: any);
}

