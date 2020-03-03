import {Injectable} from '@angular/core';


@Injectable()
export class LoadingProvider {

  // loader: any;
  constructor() { }


  show() {
    /*this.loader = Metro.activity.open({
      type: 'metro',
      overlayColor: '#fff',
      overlayAlpha: 1,
      text: '<div class=\'mt-2 text-small\'>Chargement des données...</div>',
      overlayClickClose: true
    });*/
  }

  close() {
    // Metro.activity.close(this.loader);
  }
}
