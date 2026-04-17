import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Usuario } from '../interfaz/usuario';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contacto',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss',
})
export class ContactoComponent {

  formulario: FormGroup;
    
  private usuariosSubject = new BehaviorSubject<any[]>([]);
  private filtroSubject = new BehaviorSubject<string>('');
  private ordenCampoSubject = new BehaviorSubject<string>('name');
  private ordenAscSubject = new BehaviorSubject<boolean>(true);

  usuarios$: Observable<any[]>;

  
  modoEdicion = false;
  editandoIndex: number | null = null;
  usuarioEditando: any = {};

  idEditando: number | null = null;

  ordenCampo: string = 'name';
  ordenAsc: boolean = true;

  mensaje: string = '';
  mostrarMensaje: boolean = false;

  private toastTimeout: any;

  constructor(private http: HttpClient, private fb: FormBuilder, private toastr: ToastrService) {

    this.formulario = this.fb.group({
    sex: ['', Validators.required],
    date_birthday: ['', [
    Validators.required,
    Validators.pattern(/^\d{4}-\d{2}-\d{2}$/),
    this.mayorDeEdadValidator
  ]],
    name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    addres: ['', Validators.required],
    country: ['', Validators.required],
    deparment: ['', Validators.required],
    apto: [''],
    city: ['', Validators.required],
    comment: ['', Validators.required]
  });

    this.usuarios$ = combineLatest([
      this.usuariosSubject,
      this.filtroSubject,
      this.ordenCampoSubject,
      this.ordenAscSubject
    ]).pipe(
      map(([usuarios, filtro, campo, asc]) => {

        let resultado = [...usuarios];

  
        if (filtro) {
          resultado = resultado.filter(u =>
            u.name.toLowerCase().includes(filtro) ||
            u.email.toLowerCase().includes(filtro)
          );
        }

        
        resultado.sort((a, b) => {
          if (a[campo] < b[campo]) return asc ? -1 : 1;
          if (a[campo] > b[campo]) return asc ? 1 : -1;
          return 0;
        });

        return resultado;
      })
    );

   this.formulario.get('country')?.valueChanges.subscribe(valor => {
  this.controlarDepartamento(valor);
});

    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.http.get<any>('https://cincoveinticinco.com/users.json')
      .subscribe(data => {

        const usuarios: Usuario[] = data.users.map((u: any) => ({
        id: u.id,
        sex: u.sex,
        date_birthday: u.date_birthday,
        name: u.name,
        last_name: u.last_name,
        email: u.email,
        addres: u.addres,
        country: u.country,
        deparment: u.Deparment,
        city: u.City,
        apto: u.apto,
        comment: u.comment
      }));

        this.usuariosSubject.next(usuarios);
      });
  }

  filtrar(event: any) {
    this.filtroSubject.next(event.target.value.toLowerCase());
  }

  ordenar(campo: string) {

  if (this.ordenCampo === campo) {
    this.ordenAsc = !this.ordenAsc; 
  } else {
    this.ordenCampo = campo;
    this.ordenAsc = true; 
  }

  this.ordenCampoSubject.next(this.ordenCampo);
  this.ordenAscSubject.next(this.ordenAsc);
}

editar(usuario: any, index: number) {

  this.modoEdicion = true;
  this.editandoIndex = index;

  this.idEditando = usuario.id;

  this.formulario.patchValue(usuario, { emitEvent: false });

   this.controlarDepartamento(usuario.country);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

   guardar(lista: any[]) {
    if (this.editandoIndex !== null) {
      lista[this.editandoIndex] = this.usuarioEditando;
      this.usuariosSubject.next([...lista]);
      this.editandoIndex = null;
    }
  }

  enviar() {

  if (this.formulario.invalid) {
    this.formulario.markAllAsTouched();
    return;
  }

  const datos = {
    id: Date.now(),
    ...this.formulario.value
  };

  const lista = this.usuariosSubject.value;

  if (this.modoEdicion && this.idEditando !== null) {

  const indexReal = lista.findIndex(u => u.id === this.idEditando);


    if (indexReal !== -1) { 
    
    lista[indexReal] = {
      ...lista[indexReal],
      ...this.formulario.value
    };

    }

  
this.toastr.info('Contacto actualizado correctamente');
   
  } else {

    lista.unshift(datos);

     this.toastr.success('Contacto creado correctamente');

  }

  this.usuariosSubject.next(lista);

  this.formulario.reset({sex: '', country: '', deparment: '', city: ''});
  this.modoEdicion = false;
  this.editandoIndex = null;
}

mayorDeEdadValidator(control: any) {

  if (!control.value) return null;

  const fecha = new Date(control.value);
  const hoy = new Date();

  const edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();

  const esMenor =
    edad < 18 ||
    (edad === 18 && mes < 0) ||
    (edad === 18 && mes === 0 && hoy.getDate() < fecha.getDate());

  return esMenor ? { menorEdad: true } : null;
}

controlarDepartamento(pais: string) {

  const departamento = this.formulario.get('deparment');
  const ciudad = this.formulario.get('city');

  if (pais === 'Argentina' || pais === 'Mexico') {

    departamento?.clearValidators();
    departamento?.setValue('');

    ciudad?.clearValidators();
    ciudad?.setValue('');

  } else {

    departamento?.setValidators([Validators.required]);
    ciudad?.setValidators([Validators.required]);

  }

  departamento?.updateValueAndValidity();
  ciudad?.updateValueAndValidity();
}


}
