import { Component, OnInit } from '@angular/core';
import {Router} from "@angular/router";
import {DataService} from "../core/services/data/data.service";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  constructor(private router: Router , public data: DataService) {
  }

  ngOnInit(): void {
   }
}
