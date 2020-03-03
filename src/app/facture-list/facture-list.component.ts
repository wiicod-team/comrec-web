import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-facture-list',
  templateUrl: './facture-list.component.html',
  styleUrls: ['./facture-list.component.scss']
})
export class FactureListComponent implements OnInit {

  factures;

  constructor() {
    this.factures = [
      {
        id: '1',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '10',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '100',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '1000',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '10000',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '100000',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      },
      {
        id: '1000000',
        client: 'John DOE',
        montant: 350000,
        avance: 250000,
        reste: 100000,
        statut: 'Echué',
      }
    ];
  }

  ngOnInit() {
  }

}
