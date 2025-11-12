"""
App 'disciplinar': modelos para gestão de disciplina e repreensões.
Inclui: advertências, suspensões de alunos.
"""

from django.db import models
from escola.pedagogico.models import Aluno


# ========================
# MODELO ADVERTENCIA
# ========================
class Advertencia(models.Model):
    """
    Registro de advertência disciplinar de um aluno.
    
    Uma advertência é um aviso formal por comportamento inadequado.
    
    Relacionamentos:
    - aluno: qual aluno recebeu a advertência
    """
    
    # Qual aluno foi advertido
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='advertencias')
    
    # Data em que a advertência foi registrada
    data = models.DateField()
    
    # Motivo/descrição da advertência (ex: "Indisciplina em sala de aula")
    motivo = models.CharField(max_length=200)
    
    def __str__(self):
        """Exibe 'Advertência de Aluno em Data: Motivo'"""
        return f"Advertência de {self.aluno} em {self.data}: {self.motivo}"


# ========================
# MODELO SUSPENSAO
# ========================
class Suspensao(models.Model):
    """
    Registro de suspensão de um aluno (afastamento temporário das aulas).
    
    Suspensão é uma punição mais grave que advertência (afasta o aluno por período).
    
    Relacionamentos:
    - aluno: qual aluno foi suspenso
    """
    
    # Qual aluno foi suspenso
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='suspensoes')
    
    # Data em que a suspensão começou
    data_inicio = models.DateField()
    
    # Data em que a suspensão termina (aluno volta às aulas)
    data_fim = models.DateField()
    
    # Motivo/descrição da suspensão (ex: "Violência contra colega")
    motivo = models.CharField(max_length=200)
    
    def __str__(self):
        """Exibe 'Suspensão de Aluno de Data_Inicio até Data_Fim: Motivo'"""
        return f"Suspensão de {self.aluno} de {self.data_inicio} até {self.data_fim}: {self.motivo}"