import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-facture',
  templateUrl: './facture.component.html',
  styleUrls: ['./facture.component.scss']
})
export class FactureComponent implements OnInit {
  factures;
  old_facture = [];
  selected_bill = [];
  display = 'none';

  constructor() {
    this.factures = [
      {
        id: '1',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '10',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '100',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '1000',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '10000',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '100000',
        client: 'Galse DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '1000000',
        client: 'John DOE',
        date: '20/01/2020',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      }
    ];
    this.old_facture = this.factures;
  }

  ngOnInit() {
  }

  openBillModal() {
    let tmp = [];
    this.factures.forEach(function(v, k) {
      if (v.check) {
        tmp.push(v);
      }
    });
    this.selected_bill = tmp;
    //Metro.dialog.open('#demoDialog1');
  }

  validerEncaissement() {
    console.log('Validation de l\'encaissement');
    // actualisation
  }

  checkFacture(f) {
    f.check = true;
  }

  uncheckFacture(f) {
    f.check = false;
  }


  getItems(ev: any) {
    console.log("aze");
    // Reset items back to all of the items
    this.factures = this.old_facture;

    // set val to the value of the searchbar
    const val = ev.target.value;

    if (val && val.trim() != '') {
      this.factures = this.factures.filter((item) => {
        return (item.id.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }

    // if the value is an empty string don't filter the items

  }
}
