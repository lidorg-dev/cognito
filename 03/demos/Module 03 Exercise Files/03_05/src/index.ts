
// @ts-nocheck
import Swal from 'sweetalert2'
import AWS from 'aws-sdk' 
import { Auth,Hub } from 'aws-amplify'
import { CognitoUser, ISignUpResult } from 'amazon-cognito-identity-js'


Auth.configure({
    userPoolId: 'us-east-1_SI8Jry3S2',
    userPoolWebClientId: '6na2ooiugt93k55cuqemns63h2',
    userPoolWebClientId: '6na2ooiugt93k55cuqemns63h2',
    oauth: {
      region: 'us-east-1',
      domain: 'globomanticscongnito.auth.us-east-1.amazoncognito.com',
      scope: ['email', 'openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: 'https://127.0.0.1:8080',
      redirectSignOut: 'https://127.0.0.1:8080',
      responseType: 'code' // or 'token', note that REFRESH token will only be generated when the responseType is code
    }
  })
  
  var currentUserName: string = null
  
  setupEvents();


async function loadFunctions(authResult) {
  var token = (await Auth.currentSession()).getIdToken().getJwtToken() 
  AWS.config.region = 'us-east-1';
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: 'us-east-1:b544f76b-6810-4412-a262-1defad430e81',
      Logins: {
        //   'accounts.google.com': token,
          'cognito-idp.us-east-1.amazonaws.com/us-east-1_SI8Jry3S2':token
      }
  });

  // obtain credentials
  AWS.config.credentials.get(function (err) {
      if (!err) {
          var lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });
          lambda.listFunctions({}, function (err, data) {
              if (err) {
                  document.getElementById('lambda-function-list').innerHTML = JSON.stringify(err);
              }
              else {
                  setFunctionList(data.Functions)
              }
          });
      } else {
          document.getElementById('lambda-function-list').innerHTML = JSON.stringify(err)
      }
  });
}
function setFunctionList(functions = []) {
  var createCardText = function (name, value) {
      var cardtext = document.createElement("p");
      cardtext.classList.add('card-text');
      cardtext.innerHTML = `${name} <b>${value}</b> <br>`
      return cardtext;
  }
  document.getElementById('lambda-function-list').innerHTML = '';
  functions.forEach((item) => {

      var card = document.createElement("DIV");
      card.classList.add('card')
      card.style.maxWidth = '250px'
      card.style.minWidth = '250px'
      card.style.marginRight = '20px'
      card.style.marginBottom = '10px'

      var cardimage = document.createElement("img")
      cardimage.style.height = '150px';
      cardimage.style.width = '250px';

      cardimage.classList.add('card-img-top')
      cardimage.src = "https://www.gliffy.com/hubfs/AWS-Lambda_dark-bg.svg"
      card.appendChild(cardimage);

      var cardbody = document.createElement("DIV");
      cardbody.classList.add('card-body');
      card.append(cardbody)


      cardbody.appendChild(createCardText("Name", item.FunctionName))
      cardbody.appendChild(createCardText("Description", item.Description))
      cardbody.appendChild(createCardText("LastModified", item.LastModified))
      cardbody.appendChild(createCardText("FunctionArn", item.FunctionArn))
      cardbody.appendChild(createCardText("CodeSize", item.CodeSize))


      document.getElementById('lambda-function-list').appendChild(card)

  })


}
 
async function appLoaded() {

  Hub.listen("auth", ({ payload: { event, data } }) => {
    switch (event) {
      case "signIn":
        getCurrentUser()
        break;
      case "signOut":
        getCurrentUser()
        break;
      case "customOAuthState":
        alert('custom state')
    }
  });

  await getCurrentUser();

}

function onForgotPassword() {
    var username = prompt('Enter your username');
    Auth.forgotPassword(username).then(result => {
      var confirmationCode = prompt('Enter confirmation code sent to your email')
      var newPassword = prompt('Enter your new password');
      Auth.forgotPasswordSubmit(username, confirmationCode, newPassword).then(confirationResult => {
        displayObject(confirationResult)
      })
        .catch(err => displayObject(err))
    })
      .catch(err => displayObject(err))
  }
  function onLogin() {
    let userData = {
      username: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    }
    Auth.signIn(userData.username, userData.password).then(async (result: any) => {
  
      if (result.challengeName == 'SOFTWARE_TOKEN_MFA') {
  
        var verificationCode = prompt('Enter your TOTP token');
        
        Auth.confirmSignIn(result, verificationCode, 'SOFTWARE_TOKEN_MFA').then(confirmSigninResult => {
          getCurrentUser()
        })
          .catch(err => { displayObject(err); })
      }
      else {
        getCurrentUser()
      }
      toggleModal('login', false)

    }).catch(err => {
      if (err.code == "UserNotConfirmedException") {
        currentUserName = userData.username
        toggleModal('confirm', true)
      }
      else {
        displayObject(err)
      }
    })
  }
  async function getCurrentUser(): Promise<CognitoUser> {
    try {
  
      var currentUser = <CognitoUser>(await Auth.currentAuthenticatedUser());
      console.log('getCurrentUser', currentUser);
  
      setUserState(currentUser)
      return currentUser
    }
    catch (err) {
      console.log('Error loading user', err);
      setUserState(null)
    }
  
  }
  function onSignUp() {
    let userData = {
      username: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
      confirmPassword: document.getElementById('signup-confirm-password').value,
    }
  
    currentUserName = userData.username;
  
    if (userData.password != userData.confirmPassword) return Swal.fire('Password and Confirm Password do not match.')
  
    Auth.signUp({
      username: userData.username,
      password: userData.password,
      attributes:
      {
        email: userData.username
      }
    }).then((result: ISignUpResult) => {
      if (!result.userConfirmed) {
        toggleModal('confirm', true)
      }
      else {
        toggleModal('login', true)
      }
    }).catch(err => {
      displayObject(err)
    })
  }
  function onResendConfirmationCode() {
    Auth.resendSignUp(currentUserName).then(result => {
      Swal.fire('Confirmation code resend')
    }).catch(err => {
      displayObject(err)
    })
  }
  function onUserConfirmation() {
    var confirmationCode = document.getElementById('confirmation-code').value
  
    Auth.confirmSignUp(currentUserName, confirmationCode).then(result => {
      displayObject(result)
      toggleModal('login', true)
    }).catch(err => {
      displayObject(err)
    })
  }
  
  
  
  async function checkMFAStatus() {
    Auth.getPreferredMFA(await getCurrentUser()).then(result => {
      displayObject(result)
      if (result == 'NOMFA') {
        Swal.fire({
          title: 'MFA Not Set',
          text: "Do you want to setup MFA?",
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes'
        }).then((result) => {
          if (result.value) {
            Auth.setupTOTP(user).then((code) => {
              var qrData = `otpauth://totp/Globomantics Shop(${user.getUsername()})?secret=${code}`
              var url = 'https://api.qrserver.com/v1/create-qr-code/?data=' + encodeURI(qrData) + '&amp;size=300x300';
              Swal.fire({
                title: 'Scan this using your authenticator app',
                html: `<img src='${url}'/>
                <p>${code}</p>
                `,
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Complete Setup'
              }).then(result => {
                if (result.value) {
                  var verificationCode = prompt('Enter topt token, from your authenticator app');
                  Auth.verifyTotpToken(user, verificationCode).then(() => {
                    Auth.setPreferredMFA(user, 'TOTP').then(otpResult => {
                      displayObject(otpResult)
                    })
                      .catch(err => displayObject(err))
  
                  }).catch(e => {
                    displayObject(e)
                  });
                }
              })
            });
          }
        })
      }
    })
  }
  function onLogout() {
  
    Auth.signOut().then(result => {
      setUserState(null);
    }).catch(err => {
      displayObject(err)
    })
  }
  function onHostedUISignin() {
    Auth.federatedSignIn().then(result => {
    }).catch((err: any) => {
      displayObject(err)
    })
  }
  
  function onGoogleSignin() {
    Auth.federatedSignIn({ provider: "Google" }).then(result => {
      displayObject(result)
    }).catch((err: any) => {
      displayObject(err)
    })
  }
  
  function setUserState(user: any) {
    var usernamePlaceholder = document.getElementById('username-placeholder');
    var loginButton = document.getElementById('login-button');
    var logoutButton = document.getElementById('logout-button');
    if (!user) {
      usernamePlaceholder.innerHTML = ''
      usernamePlaceholder.style.display = 'none'
      loginButton.style.display = 'block'
      logoutButton.style.display = 'none'
    }
    else {
      usernamePlaceholder.innerHTML = user.username
      usernamePlaceholder.style.display = 'block'
      loginButton.style.display = 'none'
      logoutButton.style.display = 'block'
    }
  }
  function toggleModal(modal: String, show: Boolean) {
  
    $('#confirm-modal').modal('hide');
    $('#login-modal').modal('hide');
    $('#signup-modal').modal('hide');
  
    if (show) $(`#${modal}-modal`).modal('show'); else $(`#${modal}-modal`).modal('hide');
  
  }
  function displayObject(data: any) {
    Swal.fire({
      title: data && (data.message || data.title || ''),
      html: `<div class="text-danger" style="text-align:left">  ${JSON.stringify(data || {}, null, 6)
        .replace(/\n( *)/g, function (match, p1) {
          return '<br>' + '&nbsp;'.repeat(p1.length);
        })}</div>`
    })
  }
function setupEvents() {
    document.addEventListener("DOMContentLoaded", appLoaded)
    document.getElementById('login-form').addEventListener('submit', onLogin)
    document.getElementById('signup-form').addEventListener('submit', onSignUp)
    document.getElementById('confirmation-form').addEventListener('submit', onUserConfirmation)
    document.getElementById('resend-confirmation-code-button').addEventListener('click', onResendConfirmationCode)
    document.getElementById('logout-button').addEventListener('click', onLogout)
    document.getElementById('google-signin').addEventListener('click', onGoogleSignin)
    document.getElementById('hostedui-signin').addEventListener('click', onHostedUISignin)
    document.getElementById('update-email-attribute').addEventListener('click', () => updateUserAttributes('email'))
    document.getElementById('update-phone-attribute').addEventListener('click', () => updateUserAttributes('phone_number'))
    document.getElementById('check-mfa-status').addEventListener('click', checkMFAStatus)
    document.getElementById('forgot-password-button').addEventListener('click', onForgotPassword)

  document.getElementById('load-authenticated-button').addEventListener('click', loadFunctions)

}
