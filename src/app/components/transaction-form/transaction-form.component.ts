import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss'
})
export class TransactionFormComponent implements OnChanges {
  @Input() visible = false;
  @Input() transaction: Transaction | null = null;
  @Output() saved    = new EventEmitter<Omit<Transaction, 'id'>>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    title:    ['', [Validators.required, Validators.minLength(2)]],
    amount:   [null, [Validators.required, Validators.min(0.01)]],
    type:     ['expense', Validators.required],
    category: ['', Validators.required],
    date:     [new Date().toISOString().split('T')[0], Validators.required],
    notes:    ['']
  });

  get isEditing(): boolean { return !!this.transaction; }
  get typeVal(): string { return this.form.get('type')?.value as string; }
  get categories(): string[] {
    return this.typeVal === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.transaction) {
        this.form.patchValue(this.transaction);
      } else {
        this.form.reset({
          type: 'expense',
          date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }

  onTypeChange(): void {
    this.form.get('category')?.setValue('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.value as Omit<Transaction, 'id'>);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
