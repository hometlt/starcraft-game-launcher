import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {AbstractDataService, InstallationData} from "../../core/services/data.service";




interface InstallData {
  files: string[]
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  installation: InstallationData;

  constructor(private router: Router , public data: AbstractDataService) {
  }
  ngOnInit(): void {

  }

}
