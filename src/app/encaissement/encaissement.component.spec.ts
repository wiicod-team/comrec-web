import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EncaissementComponent } from './encaissement.component';

describe('EncaissementComponent', () => {
  let component: EncaissementComponent;
  let fixture: ComponentFixture<EncaissementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EncaissementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EncaissementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
