import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ToastController, AlertController, NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';

declare var google;
 
@Component({
  selector: 'app-inside',
  templateUrl: './inside.page.html',
  styleUrls: ['./inside.page.scss'],
})
export class InsidePage implements OnInit {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  markers: any = [];

  public clientData:any = { id: 0, client_id: 0, client_name: '' };
  public clientWorksites:any = []
  public User = { email: '' };

  data = {};
 
  constructor(private authService: AuthService, 
              private storage: Storage, 
              public navCtrl: NavController, 
              private plt: Platform, 
              private geolocation: Geolocation,
              private alertController: AlertController,
              private toastController: ToastController) { }
 
  ngOnInit() {
    this.loadClientData();
  }

  ionViewDidEnter() {
    this.plt.ready().then(() => {
      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      }

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);
        this.addMarker(this.map, pos.coords.latitude, pos.coords.longitude, 'You are here!');
      }).catch((error) => {
        console.log('Error getting location', error);
      });
    
    });
  }

  loadClientData() {
    this.authService.getClientData().subscribe(res => { 
      this.clientData = res;
      this.User = this.authService.getUser();
    })
  }

  loadClientWorksites() {
    this.markers = [];

    this.authService.getClientWorksites().subscribe(res => { 
      this.clientWorksites = res;
      for(let r of this.clientWorksites) {
        this.addMarker(this.map, r.latitude, r.longitude);
      }
      this.setBounds();
    })
  }
 
  logout() {
    this.authService.logout();
  }

  showAlert(msg) {
    let alert = this.alertController.create({
      message: msg,
      header: 'Attention',
      buttons: ['OK']
    });
    alert.then(alert => alert.present());
  }

  // This function is for testing JWT protected route
  loadSpecialInfo() {
    this.authService.getSpecialData().subscribe(res => {
      this.data = res['msg'];
    });
  }
  
 
  // This function is for testing a removal of a JWT Token
  clearToken() {
    this.storage.remove('access_token');
 
    let toast = this.toastController.create({
      message: 'JWT removed',
      duration: 3000
    });
    toast.then(toast => toast.present());
  }

  /*
  *    Other Google map functions
  */

  addMarker(map:any, lat:any, lng: any, marker_content:string = null) {
    let marker = new google.maps.Marker({
      map: map,
      animation: google.maps.Animation.DROP,
      position: { lat: lat, lng: lng }, //map.getCenter()
    });

    this.markers.push(marker);
    let content = "<p><b>Information!</b><p><p>Address, etc goes here. No big deal.</p>"; 
    this.addInfoWindow(marker, marker_content || content);
  }

  setBounds() {
    let bounds = new google.maps.LatLngBounds();
    for (var i=0; i < this.markers.length; i++) {
        bounds.extend(this.markers[i].getPosition());
    }
    this.map.fitBounds(bounds);
  }  

  addInfoWindow(marker, content){
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });
  }
 
}