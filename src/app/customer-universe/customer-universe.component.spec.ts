import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerUniverseComponent } from './customer-universe.component';

describe('CustomerUniverseComponent', () => {
  let component: CustomerUniverseComponent;
  let fixture: ComponentFixture<CustomerUniverseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomerUniverseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerUniverseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
