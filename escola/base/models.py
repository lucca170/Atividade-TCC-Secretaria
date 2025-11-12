# Em: escola/base/models.py
"""
App 'base': contém o modelo de usuário customizado (Usuario) e infraestrutura base da aplicação.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser  # Herança do modelo base de autenticação do Django
from django.conf import settings

# ========================
# DEFINIÇÕES DE ESCOLHAS (CHOICES)
# ========================
# Define os tipos de cargo/role disponíveis no sistema
# Cada tupla: (valor_banco_de_dados, valor_legível_para_ui)
CARGO_CHOICES = [
    ('professor', 'Professor'),         # Professores que lecionam disciplinas
    ('aluno', 'Aluno'),                 # Alunos matriculados
    ('administrador', 'Administrador'), # Admins do sistema com acesso total
    ('coordenador', 'Coordenador'),     # Coordenadores pedagógicos
    ('diretor', 'Diretor'),             # Diretores da escola
    ('ti', 'TI'),                       # Pessoal de TI/Suporte
    ('responsavel', 'Responsável'),     # Responsáveis/Pais dos alunos
]


# ========================
# MODELO DE USUÁRIO CUSTOMIZADO
# ========================
class Usuario(AbstractUser):
    """
    Modelo de usuário customizado que estende AbstractUser do Django.
    
    Herança: AbstractUser (Django built-in)
    - Já fornece: username, password, first_name, last_name, email, is_staff, is_superuser, etc.
    
    Campos adicionados:
    - email: EmailField único e obrigatório (sobrescreve o padrão do AbstractUser)
    - cargo: Tipo de papel do usuário no sistema
    """
    
    # Campo de e-mail customizado: único e obrigatório (previne duplicatas)
    # unique=True garante que não há dois usuários com o mesmo email
    # blank=False torna o campo obrigatório no formulário
    email = models.EmailField(unique=True, blank=False)
    
    # Campo de cargo/papel do usuário
    # max_length=50 permite armazenar até 50 caracteres
    # choices=CARGO_CHOICES restringe os valores permitidos
    cargo = models.CharField(max_length=50, choices=CARGO_CHOICES)

    # REQUIRED_FIELDS define quais campos adicionais são obrigatórios na criação via manage.py createsuperuser
    # (além de username e password que são sempre obrigatórios)
    REQUIRED_FIELDS = ['email', 'cargo']

    def __str__(self):
        """Representação em string do usuário (exibido em listas admin, etc)"""
        return self.username