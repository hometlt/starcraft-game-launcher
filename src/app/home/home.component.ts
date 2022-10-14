import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {DataService, InstallationData} from "../core/services/data/data.service";




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

  constructor(private router: Router , public data: DataService) {
  }
  ngOnInit(): void {

  }

}
