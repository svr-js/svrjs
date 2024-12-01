// Type definitions for SVR.JS Core 4.x
// Project: SVR.JS Core
// Definitions by: Dorian Niemiec <dorian.niemiec@svrjs.org>

/// <reference types="node" />

import * as http from "http";

interface RequestHandler {
  (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next?: (err?: any) => void
  ): void;
}

interface InitOptions {
  page404?: string;
  enableCompression?: boolean;
  customHeaders?: { [key: string]: string };
  enableDirectoryListing?: boolean;
  enableDirectoryListingWithDefaultHead?: boolean;
  serverAdministratorEmail?: string;
  stackHidden?: boolean;
  exposeServerVersion?: boolean;
  dontCompress?: Array<RegExp | string>;
  enableIPSpoofing?: boolean;
  enableETag?: boolean;
  rewriteDirtyURLs?: boolean;
  errorPages?: Array<{
    scode: number;
    path: string;
    host?: string;
    ip?: string;
  }>;
  disableTrailingSlashRedirects?: boolean;
  allowDoubleSlashes?: boolean;
  enableIncludingHeadAndFootInHTML?: boolean;
  wwwroot?: string;
}

declare function init(config?: InitOptions): RequestHandler;

declare namespace init {
  const requestHandler: RequestHandler;
}

declare const svrjsCore: typeof init & {
  init: typeof init;
  requestHandler: RequestHandler;
};

export = svrjsCore;
