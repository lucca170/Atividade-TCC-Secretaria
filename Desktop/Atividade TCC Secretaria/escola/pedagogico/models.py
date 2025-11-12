"""
App 'pedagogico': modelos de gestão pedagógica da escola.
Inclui: turmas, disciplinas, alunos, notas, faltas, presença, plano de aula, etc.
"""

from django.db import models
from django.conf import settings
from escola.coordenacao.models import MaterialDidatico


# ========================
# MODELO MATERIA (Disciplina Base)
# ========================
class Materia(models.Model):
    """
    Definição de uma matéria/disciplina do currículo.
    Ex: Matemática, Português, História, Biologia.
    
    Esta é a "matéria pronta" (template). A relação com uma turma específica
    é feita através do modelo Disciplina (que é uma "oferta da matéria").
    
    Relacionamentos:
    - disciplinas (reverse): referências de Disciplina
    """
    # Nome único da matéria (evita duplicatas)
    nome = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        """Representação em string"""
        return self.nome
    
    class Meta:
        # Nome plural customizado para exibição no admin
        verbose_name_plural = "Matérias Prontas"


# ========================
# MODELO TURMA
# ========================
class Turma(models.Model):
    """
    Uma turma da escola (ex: 1ª série A, 2ª série B).
    
    Relacionamentos:
    - alunos (reverse): alunos matriculados
    - disciplinas (reverse): disciplinas/matérias oferecidas
    - eventos_academicos (reverse): provas, trabalhos, eventos da turma
    """
    
    # Opções de turno (período em que a aula ocorre)
    TURNO_CHOICES = (
        ('manha', 'Manhã'),
        ('tarde', 'Tarde'),
        ('noite', 'Noite'),
    )
    
    # Nome da turma (ex: "1A", "2B")
    nome = models.CharField(max_length=50)
    
    # Período em que a turma funciona
    turno = models.CharField(max_length=10, choices=TURNO_CHOICES)
    
    def __str__(self):
        """Exibe nome + turno (ex: '1A (Manhã)')"""
        return f"{self.nome} ({self.get_turno_display()})"


# ========================
# MODELO DISCIPLINA (Oferta da Matéria)
# ========================
class Disciplina(models.Model):
    """
    Representa a OFERTA de uma matéria em uma turma específica.
    
    Exemplo:
    - Materia: "Matemática"
    - Turma: "1A"
    - Disciplina: "Matemática na turma 1A", com professor(es) X, Y
    
    Uma matéria (Matemática) pode ser oferecida em várias turmas (1A, 1B, 2A).
    Uma turma pode oferecer várias matérias (Matemática, Português, História).
    
    Relacionamentos:
    - materia: qual matéria é oferecida (ForeignKey)
    - turma: em qual turma (ForeignKey)
    - professores: quem ensina (ManyToMany, permite múltiplos professores)
    - notas (reverse): notas dos alunos nesta disciplina
    - faltas (reverse): faltas dos alunos
    - presenca (reverse): presença dos alunos
    - eventos_academicos (reverse): provas, trabalhos desta disciplina
    - planos_de_aula (reverse): planos de aula associados
    """
    
    # A matéria/disciplina sendo oferecida (ex: "Matemática")
    # on_delete=CASCADE: se matéria for deletada, disciplina também será
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='disciplinas')
    
    # Quais professores lecionam esta disciplina?
    # ManyToMany: um professor pode lecionar várias disciplinas
    # limit_choices_to: restringe a escolha no admin para apenas usuários com cargo='professor'
    professores = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='disciplinas',
        limit_choices_to={'cargo': 'professor'}
    )
    
    # Em qual turma esta disciplina é oferecida?
    # on_delete=CASCADE: se turma for deletada, disciplina também será
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='disciplinas')
    
    # Carga horária total (quantidade de aulas)
    # help_text aparece no admin como dica
    carga_horaria = models.PositiveIntegerField(default=80, help_text="Total de aulas no período/ano.")

    def __str__(self):
        """Exibe 'Materia - Turma' (ex: 'Matemática - 1A')"""
        return f"{self.materia.nome} - {self.turma.nome}"
    
    class Meta:
        # Garante unicidade: não pode haver "Matemática" duas vezes na mesma turma
        unique_together = ('materia', 'turma')
        verbose_name_plural = "Disciplinas (Ofertas por Turma)"


# ========================
# MODELO ALUNO
# ========================
class Aluno(models.Model):
    """
    Perfil estendido de um usuário que é aluno.
    
    Cada aluno possui:
    - Um usuário associado (OneToOneField) com dados base (username, email, etc)
    - Uma turma matriculada
    - Um status (ativo, inativo, evadido, etc)
    
    Relacionamentos:
    - usuario: relação 1-1 com Usuario (dados de login)
    - turma: em qual turma o aluno está matriculado
    - notas (reverse): notas em disciplinas
    - responsaveis (reverse): responsáveis/pais
    """
    
    # Possíveis status de um aluno
    STATUS_CHOICES = (
        ('ativo', 'Ativo'),
        ('inativo', 'Inativo'),
        ('evadido', 'Evadido'),
        ('transferido', 'Transferido'),
        ('concluido', 'Concluído'),
    )
    
    # Usuário associado (login e dados pessoais)
    # OneToOneField: cada aluno está ligado a exatamente um usuário
    # on_delete=CASCADE: se usuário for deletado, aluno também será
    # related_name='aluno_profile': permite acessar aluno via usuario.aluno_profile
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='aluno_profile'
    )
    
    # Turma em que o aluno está matriculado
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='alunos')
    
    # Status atual do aluno (ativo, evadido, etc)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ativo')
    
    def __str__(self):
        """Exibe nome completo ou username do usuário"""
        return self.usuario.get_full_name() or self.usuario.username


# ========================
# MODELO NOTA
# ========================
class Nota(models.Model):
    """
    Registro de nota/avaliação de um aluno em uma disciplina.
    
    Relacionamentos:
    - aluno: qual aluno foi avaliado
    - disciplina: em qual disciplina/matéria
    """
    
    # Qual aluno recebeu a nota
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='notas')
    
    # Em qual disciplina
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, related_name='notas')
    
    # Qual bimestre/período (ex: "1º Bimestre", "1º Semestre")
    bimestre = models.CharField(max_length=20, default='1º Bimestre')
    
    # Valor da nota (0.00 a 10.00)
    valor = models.DecimalField(max_digits=5, decimal_places=2)
    
    class Meta:
        # Um aluno não pode ter duas notas na mesma disciplina no mesmo bimestre
        unique_together = ('aluno', 'disciplina', 'bimestre')
    
    def __str__(self):
        """Exibe 'Aluno - Disciplina (Bimestre): Nota'"""
        return f"{self.aluno} - {self.disciplina} ({self.bimestre}): {self.valor}"


# ========================
# MODELO FALTA
# ========================
class Falta(models.Model):
    """
    Registro de ausência/falta de um aluno em uma disciplina.
    
    Relacionamentos:
    - aluno: qual aluno faltou
    - disciplina: em qual disciplina
    """
    
    # Qual aluno faltou
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE)
    
    # Em qual disciplina o aluno faltou
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    
    # Data em que a falta ocorreu
    data = models.DateField()
    
    # Se a falta foi justificada (atestado médico, etc)
    justificada = models.BooleanField(default=False)
    
    def __str__(self):
        """Exibe 'Aluno - Data'"""
        return f"{self.aluno} - {self.data}"


# ========================
# MODELO PRESENCA
# ========================
class Presenca(models.Model):
    """
    Registro de presença de um aluno em uma disciplina.
    
    Relacionamentos:
    - aluno: qual aluno estava presente
    - disciplina: em qual disciplina
    """
    
    # Qual aluno estava presente
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE)
    
    # Em qual disciplina o aluno compareceu
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE)
    
    # Data da presença
    data = models.DateField()
    
    def __str__(self):
        """Exibe 'Aluno - Data'"""
        return f"{self.aluno} - {self.data}"


# ========================
# MODELO EMPRESTIMOMAT ERIAL
# ========================
class EmprestimoMaterial(models.Model):
    """
    Registro de empréstimo de material didático (livros, equipamentos).
    
    Relacionamentos:
    - material: qual material foi emprestado
    - aluno: quem pegou emprestado (opcional: pode ser emprestado para não-alunos)
    """
    
    # Qual material foi emprestado
    material = models.ForeignKey(MaterialDidatico, on_delete=models.CASCADE)
    
    # Quem pegou emprestado (Aluno)
    # null=True, blank=True: permite material emprestado para alguém que não é aluno
    aluno = models.ForeignKey('pedagogico.Aluno', on_delete=models.CASCADE, null=True, blank=True)
    
    # Data em que foi realizado o empréstimo
    data_emprestimo = models.DateField()
    
    # Data em que o material foi devolvido (null = ainda não foi devolvido)
    data_devolucao = models.DateField(null=True, blank=True)
    
    def __str__(self):
        """Exibe 'Material - Data de Empréstimo'"""
        return f"{self.material.nome} - {self.data_emprestimo}"


# ========================
# MODELO RESPONSAVEL
# ========================
class Responsavel(models.Model):
    """
    Perfil estendido para usuários que são responsáveis/pais/tutores.
    
    Um responsável pode ser responsável por múltiplos alunos.
    
    Relacionamentos:
    - usuario: relação 1-1 com Usuario (dados de login)
    - alunos: quais alunos este responsável é responsável (ManyToMany)
    """
    
    # Usuário associado (login e dados pessoais)
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='responsavel_profile'
    )
    
    # Quais alunos este responsável é responsável (pode haver múltiplos filhos)
    alunos = models.ManyToManyField(Aluno, related_name='responsaveis')
    
    def __str__(self):
        """Exibe nome completo ou username"""
        return self.usuario.get_full_name() or self.usuario.username


# ========================
# MODELO EVENTO ACADEMICO
# ========================
class EventoAcademico(models.Model):
    """
    Evento/atividade acadêmica da escola (provas, trabalhos, feriados, reuniões).
    
    Relacionamentos:
    - turma: turma relacionada (opcional)
    - disciplina: disciplina relacionada (opcional)
    """
    
    # Tipos de evento possíveis
    TIPO_CHOICES = (
        ('prova', 'Prova'),
        ('trabalho', 'Entrega de Trabalho'),
        ('feriado', 'Feriado'),
        ('evento', 'Evento Escolar'),
        ('reuniao', 'Reunião'),
    )
    
    # Título/nome do evento
    titulo = models.CharField(max_length=100)
    
    # Data/hora de início do evento
    data_inicio = models.DateTimeField()
    
    # Data/hora de término (opcional)
    data_fim = models.DateTimeField(null=True, blank=True)
    
    # Tipo de evento
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    
    # Descrição detalhada (opcional)
    descricao = models.TextField(blank=True)
    
    # Turma relacionada (opcional: pode não estar ligado a turma específica)
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='eventos_academicos', null=True, blank=True)
    
    # Disciplina relacionada (opcional: pode não estar ligado a disciplina específica)
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, related_name='eventos_academicos', null=True, blank=True)
    
    def __str__(self):
        """Exibe 'Tipo - Título (Data)'"""
        return f"{self.get_tipo_display()} - {self.titulo} ({self.data_inicio.strftime('%d/%m/%Y')})"


# ========================
# MODELO PLANO DE AULA
# ========================
class PlanoDeAula(models.Model):
    """
    Plano de aula: o que o professor planeja lecionar/fazer em uma aula.
    
    Relacionamentos:
    - disciplina: em qual disciplina é esta aula
    """
    
    # Em qual disciplina/matéria é esta aula
    disciplina = models.ForeignKey(Disciplina, on_delete=models.CASCADE, related_name='planos_de_aula')
    
    # Data da aula
    data = models.DateField()
    
    # Conteúdo que será lecionado
    conteudo_previsto = models.TextField(verbose_name="Conteúdo Previsto")
    
    # Atividades, exercícios e observações
    atividades = models.TextField(blank=True, verbose_name="Atividades/Observações")
    
    class Meta:
        # Não pode haver dois planos para a mesma disciplina na mesma data
        unique_together = ('disciplina', 'data')
        # Ordena planos por data (mais recentes primeiro quando reversed)
        ordering = ['data']
    
    def __str__(self):
        """Exibe 'Plano de Disciplina - Data'"""
        return f"Plano de {self.disciplina} - {self.data}"


# ========================
# MODELO NOTIFICACAO
# ========================
class Notificacao(models.Model):
    """
    Notificação para um usuário (aluno, professor, responsável, etc).
    
    Exemplos:
    - "Nova nota registrada em Matemática"
    - "Falta registrada em Português"
    - "Reunião agendada"
    
    Relacionamentos:
    - destinatario: para quem é a notificação
    """
    
    # Para quem é a notificação (qualquer usuário)
    destinatario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes'
    )
    
    # Conteúdo da notificação
    mensagem = models.TextField()
    
    # Data/hora em que a notificação foi gerada (auto-preenchido)
    data_envio = models.DateTimeField(auto_now_add=True)
    
    # Se a notificação foi lida pelo destinatário
    lida = models.BooleanField(default=False)
    
    class Meta:
        # Ordena por data mais recente primeiro
        ordering = ['-data_envio']
    
    def __str__(self):
        """Exibe 'Notificação para Usuario em Data'"""
        return f"Notificação para {self.destinatario.username} em {self.data_envio.strftime('%d/%m')}"