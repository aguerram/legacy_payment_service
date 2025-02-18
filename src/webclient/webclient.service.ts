import { Injectable, Logger } from '@nestjs/common';
import axios, {
  AxiosRequestConfig,
  AxiosInstance,
  AxiosResponse,
  AxiosError,
} from 'axios';
import { encode } from 'base-64';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class WebclientService {
  private smsAxios: AxiosInstance;
  private checkoutServiceAxios: AxiosInstance;

  private logger: Logger = new Logger(WebclientService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {
    //Interceptors

    const requestInterceptor = (req: AxiosRequestConfig) => {
      this.logger.warn(
        `Request to path [${String(req.method).toUpperCase()}] ${req.baseURL}${req.url
        } -- data : ${req.data ? JSON.stringify(req.data) : '[NO-DATA]'}`,
      );

      req.headers['Content-type'] = 'application/json';

      return req;
    };

    const responseInterceptor = (res: AxiosResponse) => {
      this.logger.log(
        `Response data ${JSON.stringify(res.data)} -- status ${res.status}`,
      );
      return res;
    };
    const responseExceptionHandler = (err: AxiosError) => {
      if (err?.response?.data) {
        this.logger.log(
          `Response err ${JSON.stringify(err?.response?.data)} -- status ${err?.response?.status
          }`,
        );
      }
      return Promise.reject(err);
    };

 
    this.smsAxios = axios.create({
      baseURL: process.env.OOREDOO_BASE_URL,
      // headers:{
      //   Accept:"application/json"
      // },
      params:{
        customerID:process.env.OOREDOO_ID,
        userName:process.env.OOREDOO_USERNAME,
        userPassword:process.env.OOREDOO_PASSWORD,
        originator:process.env.OOREDOO_ORIGINATOR,
        messageType:0,
        blink:false,
        flash:false,
        Private:false,
      }
    });


    const authorization = encode(
      `${process.env.PAYMENT_SERVICE_ACCESS_USERNAME}:${process.env.PAYMENT_SERVICE_ACCESS_PASSWORD}`
    );
    this.checkoutServiceAxios = axios.create({
      baseURL: process.env.PAYMENT_SERVICE_URL,
      headers: {
        authorization: `Basic ${authorization}`
      }
    });

    //Request interceptors
    this.smsAxios.interceptors.request.use(requestInterceptor);
    this.checkoutServiceAxios.interceptors.request.use(requestInterceptor);

    //Response interceptors
    this.smsAxios.interceptors.response.use(
      responseInterceptor,
      responseExceptionHandler,
    );
    this.checkoutServiceAxios.interceptors.response.use(
      responseInterceptor,
      responseExceptionHandler,
    );
  }

  /**
   * Call to sms ooredoo
   */
  public getSmsCall() {
    return this.smsAxios;
  }

  /**
   * Call to checkout api
   */
   public getCheckoutCall() {
    return this.checkoutServiceAxios;
  }



  
}
