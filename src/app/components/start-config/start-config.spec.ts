import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartConfig } from './start-config';

describe('StartConfig', () => {
  let component: StartConfig;
  let fixture: ComponentFixture<StartConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartConfig);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
