from django.test import TestCase
from django.db import IntegrityError

from .forms import CustomUserCreationForm
from .models import Usuario


class CustomUserCreationFormTests(TestCase):
	def test_custom_user_creation_form_valid(self):
		"""Form should be valid with matching passwords and save the user correctly."""
		form_data = {
			'username': 'testuser',
			'email': 'test@example.com',
			'first_name': 'Test',
			'last_name': 'User',
			'cargo': 'professor',
			'password1': 'ComplexPass123!',
			'password2': 'ComplexPass123!',
		}
		form = CustomUserCreationForm(data=form_data)
		self.assertTrue(form.is_valid(), msg=f"Form errors: {form.errors}")
		user = form.save()
		# Usuário foi salvo e possui id
		self.assertIsNotNone(user.pk)
		# Campos customizados foram persistidos
		self.assertEqual(user.email, 'test@example.com')
		self.assertEqual(user.cargo, 'professor')
		# Senha foi corretamente hashada
		self.assertTrue(user.check_password('ComplexPass123!'))

	def test_duplicate_email_invalid(self):
		"""Criar um usuário com email duplicado deve falhar por causa do unique=True."""
		# Cria primeiro usuário
		Usuario.objects.create_user(username='u1', email='dup@example.com', password='xpass', cargo='professor')

		# Tenta criar outro usuário com mesmo email via form
		form_data = {
			'username': 'u2',
			'email': 'dup@example.com',
			'first_name': 'Dup',
			'last_name': 'User',
			'cargo': 'aluno',
			'password1': 'AnotherPass123',
			'password2': 'AnotherPass123',
		}
		form = CustomUserCreationForm(data=form_data)

		# O formulário deve ser inválido por causa do email duplicado
		self.assertFalse(form.is_valid())
		self.assertIn('email', form.errors)


class AdminIntegrationTests(TestCase):
	def test_admin_can_add_user(self):
		"""Testa que o admin consegue criar um usuário via view do admin."""
		# Cria um superuser para logar no admin
		admin = Usuario.objects.create_superuser(
			username='admin',
			email='admin@example.com',
			password='adminpass',
			cargo='administrador'
		)

		logged = self.client.login(username='admin', password='adminpass')
		self.assertTrue(logged, "Não foi possível logar no admin com o superuser criado")

		add_url = '/admin/base/usuario/add/'

		post_data = {
			'username': 'newadminuser',
			'email': 'newuser@example.com',
			'first_name': 'New',
			'last_name': 'User',
			'cargo': 'ti',
			'password1': 'AdminCreate123!',
			'password2': 'AdminCreate123!',
			'_save': 'Salvar',
		}

		response = self.client.post(add_url, data=post_data, follow=True)

		# Verifica que houve redirecionamento (salvou e retornou para a lista do admin)
		self.assertEqual(response.status_code, 200)

		# O usuário deve existir no banco de dados
		user = Usuario.objects.filter(username='newadminuser').first()
		self.assertIsNotNone(user, "Usuário não foi criado via admin")
		self.assertEqual(user.email, 'newuser@example.com')
		self.assertTrue(user.check_password('AdminCreate123!'))

	def test_admin_cannot_add_user_with_duplicate_email(self):
		"""Tenta criar usuário no admin com email duplicado e espera erro."""
		# superuser
		admin = Usuario.objects.create_superuser(
			username='admin2',
			email='admin2@example.com',
			password='adminpass2',
			cargo='administrador'
		)

		# usuário existente com o email duplicado
		Usuario.objects.create_user(username='existing', email='dup@example.com', password='x', cargo='professor')

		self.client.login(username='admin2', password='adminpass2')
		add_url = '/admin/base/usuario/add/'

		post_data = {
			'username': 'trydup',
			'email': 'dup@example.com',
			'first_name': 'Try',
			'last_name': 'Dup',
			'cargo': 'aluno',
			'password1': 'SomePass123!',
			'password2': 'SomePass123!',
			'_save': 'Salvar',
		}

		response = self.client.post(add_url, data=post_data)

		# Deve retornar a página do formulário com erros (status 200)
		self.assertEqual(response.status_code, 200)
		# Não deve ter criado o usuário
		self.assertFalse(Usuario.objects.filter(username='trydup').exists())
		# A página de admin mostra a lista de erros com a classe 'errorlist'
		self.assertIn(b'errorlist', response.content)

	def test_admin_missing_password_shows_error(self):
		"""Tenta criar usuário sem informar senha e espera erro no formulário do admin."""
		admin = Usuario.objects.create_superuser(
			username='admin3',
			email='admin3@example.com',
			password='adminpass3',
			cargo='administrador'
		)
		self.client.login(username='admin3', password='adminpass3')

		add_url = '/admin/base/usuario/add/'
		post_data = {
			'username': 'nopassuser',
			'email': 'nopass@example.com',
			'first_name': 'No',
			'last_name': 'Pass',
			'cargo': 'ti',
			# omit password1/password2
			'_save': 'Salvar',
		}

		response = self.client.post(add_url, data=post_data)
		self.assertEqual(response.status_code, 200)
		# Não foi criado
		self.assertFalse(Usuario.objects.filter(username='nopassuser').exists())
		# Há erros no formulário
		self.assertIn(b'errorlist', response.content)
