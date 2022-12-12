import {Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {AbstractDataService} from "../../core/services/data.service";


@Component({
  selector: 'app-installation',
  templateUrl: './installation.component.html',
  styleUrls: ['./installation.component.scss']
})
export class InstallationComponent implements OnInit {

  constructor(private router: Router , public data: AbstractDataService) {
  }

  ngOnInit(): void {
   }
}
