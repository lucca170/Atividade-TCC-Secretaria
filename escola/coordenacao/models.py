# Em: escola/coordenacao/models.py
"""
App 'coordenacao': modelos para gerenciamento de recursos e coordenação.
Inclui: material didático, salas/laboratórios, reservas, relatórios, colaboradores.
"""

from django.db import models
from django.conf import settings


# ========================
# MODELO MATERIAL DIDATICO
# ========================
class MaterialDidatico(models.Model):
    """
    Material/recurso didático disponível na escola.
    Exemplos: livros, projetores, retroprojetores, computadores, etc.
    
    Controla quantidade e disponibilidade.
    Pode ser emprestado através de EmprestimoMaterial (em pedagogico/).
    """
    
    # Nome do material
    nome = models.CharField(max_length=100)
    
    # Tipo/categoria (ex: "Livro", "Equipamento Eletrônico", "Didático")
    tipo = models.CharField(max_length=50)
    
    # Quantidade total disponível
    quantidade = models.PositiveIntegerField(default=1)
    
    # Se o material está disponível para empréstimo
    disponivel = models.BooleanField(default=True)

    def __str__(self):
        """Exibe o nome do material"""
        return self.nome


# ========================
# MODELO SALA/LABORATORIO
# ========================
class SalaLaboratorio(models.Model):
    """
    Sala ou laboratório da escola.
    Exemplos: Sala de Informática, Laboratório de Química, Sala 1A, etc.
    
    Podem ser reservadas através de ReservaSala.
    
    Relacionamentos:
    - reservas (reverse): reservas desta sala
    """
    
    # Nome da sala (ex: "Lab. Informática", "Sala 1A")
    nome = models.CharField(max_length=50)
    
    # Tipo de sala (ex: "Laboratório", "Sala de Aula", "Auditório")
    tipo = models.CharField(max_length=50)
    
    # Quantas pessoas cabem na sala
    capacidade = models.PositiveIntegerField()

    def __str__(self):
        """Exibe o nome da sala"""
        return self.nome


# ========================
# MODELO RESERVA DE SALA
# ========================
class ReservaSala(models.Model):
    """
    Registro de uma reserva de sala por um usuário.
    Controla quando cada sala será usada.
    
    Relacionamentos:
    - sala: qual sala foi reservada
    - usuario: quem fez a reserva
    """
    
    # Qual sala foi reservada
    sala = models.ForeignKey(SalaLaboratorio, on_delete=models.CASCADE)
    
    # Quem fez a reserva (professor, coordenador, etc)
    # null=True: permite que o usuário seja deletado mas a reserva fica com usuario=None
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    # Data e hora de início da reserva
    data_inicio = models.DateTimeField()
    
    # Data e hora de término da reserva
    data_fim = models.DateTimeField()

    def __str__(self):
        """Exibe 'Sala - Data de Início'"""
        return f"{self.sala.nome} - {self.data_inicio}"


# ========================
# MODELO RELATORIO GERENCIAL
# ========================
class RelatorioGerencial(models.Model):
    """
    Relatório gerado pela coordenação/administração.
    Pode ser em PDF, Excel, etc.
    
    Exemplos: relatório de desempenho dos alunos, frequência, financeiro, etc.
    """
    
    # Título do relatório
    titulo = models.CharField(max_length=100)
    
    # Data em que o relatório foi gerado (auto-preenchido)
    data_geracao = models.DateTimeField(auto_now_add=True)
    
    # Tipo de relatório (ex: "Desempenho", "Frequência", "Financeiro")
    tipo = models.CharField(max_length=50)
    
    # Arquivo do relatório (PDF, Excel, etc)
    # upload_to='relatorios/' armazena em pasta relatorios/
    arquivo = models.FileField(upload_to='relatorios/')

    def __str__(self):
        """Exibe o título do relatório"""
        return self.titulo


# ========================
# MODELO COLABORADOR
# ========================
class Colaborador(models.Model):
    """
    Colaborador externo da escola (não é usuário do sistema).
    Pode ser fornecedor, instrutor externo, consultor, etc.
    
    Nota: Diferente de Usuario/Aluno/Professor que têm login.
    """
    
    # Nome completo
    nome = models.CharField(max_length=100)
    
    # CPF (documento de identificação, único)
    cpf = models.CharField(max_length=14, unique=True)
    
    # Qual o cargo/função do colaborador
    cargo = models.CharField(max_length=50)

    def __str__(self):
        """Exibe o nome do colaborador"""
        return self.nome