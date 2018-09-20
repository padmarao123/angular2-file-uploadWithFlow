import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../../shared/services/user.service';
import { JwtService } from '../../../../../shared/services/jwt.service';
import { ApiService } from '../../../../../shared/services/api.service';
declare var jquery: any;
declare var $: any;
declare var Flow: any;
import { environment } from '../../../../../../environments/environment'
@Component({
  selector: 'stakeholder-file-form',
  templateUrl: './sth-file-form.component.html',
  styleUrls: ['./sth-file-form.component.css']
})
export class StakeholderFileFormComponent implements OnInit {

  st_id: any;
  files: any;
  file: any
  file_types: any;
  file_data: any = {
    type: ''
  };
  allowedFileSize = 100 * 1024 * 1024;
  @ViewChild('fileUploader') filebrowser: ElementRef;
  fileUploaderObj: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private jwtService: JwtService,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    // this.st_id = this.route.parent.snapshot.parent.params['st_id'];
    this.st_id = this.route.parent.snapshot.parent.parent.parent.params['st_id'];
    this.getFileTypes();
    this.setUpFileUploader();

  }
  setUpFileUploader() {

    function readablizeBytes(bytes) {
      var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
      var e = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
    }

    function secondsToStr(temp) {
      function numberEnding(number) {
        return (number > 1) ? 's' : '';
      }
      var years = Math.floor(temp / 31536000);
      if (years) {
        return years + ' year' + numberEnding(years);
      }
      var days = Math.floor((temp %= 31536000) / 86400);
      if (days) {
        return days + ' day' + numberEnding(days);
      }
      var hours = Math.floor((temp %= 86400) / 3600);
      if (hours) {
        return hours + ' hour' + numberEnding(hours);
      }
      var minutes = Math.floor((temp %= 3600) / 60);
      if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
      }
      var seconds = temp % 60;
      return seconds + ' second' + numberEnding(seconds);
    }
    var that = this;
    this.fileUploaderObj = new Flow({
      target: environment.apiUrl + 'stakeholders/files/flowmulticreate',
      chunkSize: 1024 * 1024 * 2,
      singleFile: true,
      query: function () {
        return {
          token: that.jwtService.getToken().toString().replace("Bearer ", ""),
          stakeholder_id: that.st_id,
          type: that.file_data.type,
          name: that.file_data.name,
          number: that.file_data.number,
        }
      }
    });

    this.fileUploaderObj.assignBrowse(this.filebrowser);

    this.fileUploaderObj.on('fileAdded', function (file, event) {
      $('.flow-progress, .flow-list').show();
      // Add the file to the list
      $('.flow-list').append(
        '<li class="flow-file flow-file-' + file.uniqueIdentifier + '">' +
        'Uploading <span class="flow-file-name"></span> ' +

        ' <button type="button" class="btn btn-xs btn-info waves-effect btn-rounded waves-light">' +
        '<span class="flow-file-size"></span>'
        + '</button>'
        +
        // '<span class="flow-file-progress"></span> ' +

        // '<span class="flow-file-pause">' +
        // ' <img src="pause.png" title="Pause upload" />' +
        // '</span>' +
        // '<span class="flow-file-resume">' +
        // ' <img src="resume.png" title="Resume upload" />' +
        // '</span>' +
        '<span class="flow-file-cancel" >' +
        ' <button type="button" class="btn btn-xs btn-danger waves-effect btn-rounded waves-light">' +
        'Cancel'
        + '</button>' +
        '</span>'
      );
      var $self = $('.flow-file-' + file.uniqueIdentifier);
      $self.find('.flow-file-name').text(file.name);
      $self.find('.flow-file-size').text(readablizeBytes(file.size));
      // $self.find('.flow-file-download').attr('href', '/download/' + files.uniqueIdentifier).hide();
      $self.find('.flow-file-pause').on('click', function () {
        file.pause();
        $self.find('.flow-file-pause').hide();
        $self.find('.flow-file-resume').show();
      });
      $self.find('.flow-file-resume').on('click', function () {
        file.resume();
        $self.find('.flow-file-pause').show();
        $self.find('.flow-file-resume').hide();
      });
      $self.find('.flow-file-cancel').on('click', function () {
        file.cancel();
        $self.remove();
      });
    });
    this.fileUploaderObj.on('fileAdded', function (file, message) {
      //check validation
      var validFileTypes = ["jpg", "jpeg", "png", "pdf", "doc", "docx", "xls",];

      var validType = true;

      if (validFileTypes.indexOf(file.getExtension()) == -1) {
        $.toast({
          heading: 'Validations',
          text: "Only " + validFileTypes.toString() + " will be uploaded",
          icon: 'info',
          loader: false, // Change it to false to disable loader
          hideAfter: 8000,
          position: 'top-right'
        });
        validType = false;
      }
      else if (file.size > this.allowedFileSize) {
        $.toast({
          heading: 'Validations',
          text: 'File size more than' + this.convertToMb(this.allowedFileSize) + 'MB is not allowed.',
          icon: 'info',
          loader: false, // Change it to false to disable loader
          hideAfter: 6000,
          position: 'top-right'
        });
        validType = false;
      }
      else {

      }
      return validType;

    });
    this.fileUploaderObj.on('fileSuccess', function (file, message) {
      console.log(file, message);
      this.file = file;
    });
    this.fileUploaderObj.on('complete', function (file, message) {
      console.log(file, message);
      this.file = file;
      $.toast({
        heading: 'Success',
        text: "File successfully uploaded ",
        icon: 'success',
        loader: true, // Change it to false to disable loader
        hideAfter: 5000,
        position: 'top-right'
      });
      that.closeForm();

    });
    this.fileUploaderObj.on('fileError', function (file, message) {
      // Reflect that the file upload has resulted in error
      $('.flow-file-' + file.uniqueIdentifier + ' .flow-file-progress').html('(file could not be uploaded: ' + message + ')');
    });

    this.fileUploaderObj.on('fileProgress', (file) => {
      // Handle progress for both the file and the overall upload
      $('.flow-file-' + file.uniqueIdentifier + ' .flow-file-progress')
        .html(Math.floor(file.progress() * 100) + '% '
        + readablizeBytes(file.averageSpeed) + '/s '
        + secondsToStr(file.timeRemaining()) + ' remaining');
      $('.progress-bar').css({ width: Math.floor(this.fileUploaderObj.progress() * 100) + '%' });
    });
    console.log(this.fileUploaderObj)
  }


  startFileUpload() {
    this.fileUploaderObj.upload();
  }

  convertToMb(size) {
    return (size / (1024 * 1024));
  };

  getFileTypes() {
    this.apiService.getWithData('etc/fileTypes', {

    }).subscribe((response) => {
      this.file_types = response;

    },
      (errorReponse) => {
        console.log(errorReponse);
      });
  }

  closeForm() {
    window.history.back();
  }
}
