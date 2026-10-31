/* ============================================================
   OrganizaColégio — funcionalidades
   Dados persistidos no LocalStorage do navegador.
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "organizacolegio:atividades:v1";

  const MATERIAS = {
    "Matemática": { cor: "#4f46e5", bg: "#eef0ff" },
    "Português": { cor: "#ea580c", bg: "#fff7ed" },
    "Biologia": { cor: "#059669", bg: "#ecfdf5" },
    "História": { cor: "#b45309", bg: "#fffbeb" },
    "Geografia": { cor: "#0d9488", bg: "#f0fdfa" },
    "Química": { cor: "#e11d48", bg: "#fff1f2" },
    "Física": { cor: "#0284c7", bg: "#f0f9ff" },
    "Inglês": { cor: "#7c3aed", bg: "#f5f3ff" },
    "Filosofia": { cor: "#9333ea", bg: "#faf5ff" },
    "Sociologia": { cor: "#db2777", bg: "#fdf2f8" },
    "Artes": { cor: "#ca8a04", bg: "#fefce8" },
    "Outro": { cor: "#64748b", bg: "#f1f5f9" }
  };

  const TIPOS = [
    "Trabalho",
    "Prova",
    "Exercício",
    "Resumo",
    "Apresentação",
    "Leitura",
    "Pesquisa",
    "Outro"
  ];

  const PRIORIDADES = {
    alta: { rotulo: "Alta", peso: 3 },
    media: { rotulo: "Média", peso: 2 },
    baixa: { rotulo: "Baixa", peso: 1 }
  };

  const VIEWS = {
    dashboard: {
      titulo: "Dashboard",
      crumb: "Painel do estudante",
      placeholder: "Buscar próximas atividades..."
    },
    atividades: {
      titulo: "Minhas atividades",
      crumb: "Organização",
      placeholder: "Buscar atividades..."
    },
    calendario: {
      titulo: "Calendário",
      crumb: "Planejamento",
      placeholder: "Buscar no dia..."
    },
    concluidas: {
      titulo: "Concluídas",
      crumb: "Histórico",
      placeholder: "Buscar concluídas..."
    }
  };

  const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
  const $$ = (seletor, contexto = document) => Array.from(contexto.querySelectorAll(seletor));

  const el = {
    sidebar: $("#sidebar"),
    scrim: $("#scrim"),
    menuBtn: $("#menuBtn"),
    brandLink: $("#brandLink"),
    pageTitle: $("#pageTitle"),
    pageCrumb: $("#pageCrumb"),
    searchInput: $("#searchInput"),
    todayLabel: $("#todayLabel"),

    notifBtn: $("#notifBtn"),
    notifPopover: $("#notifPopover"),
    notifCount: $("#notifCount"),
    notifBody: $("#notifBody"),
    notifSeeAll: $("#notifSeeAll"),

    welcomeSub: $("#welcomeSub"),
    statTotal: $("#statTotal"),
    statTotalNote: $("#statTotalNote"),
    statDone: $("#statDone"),
    statDoneNote: $("#statDoneNote"),
    statPending: $("#statPending"),
    statPendingNote: $("#statPendingNote"),
    statLate: $("#statLate"),
    statLateNote: $("#statLateNote"),
    pendingBadge: $("#pendingBadge"),

    activityList: $("#activityList"),
    upcomingSub: $("#upcomingSub"),
    seeAllBtn: $("#seeAllBtn"),

    progressRing: $("#progressRing"),
    progressValue: $("#progressValue"),
    progressTag: $("#progressTag"),
    progressNoteText: $("#progressNoteText"),
    legendDone: $("#legendDone"),
    legendPending: $("#legendPending"),
    legendLate: $("#legendLate"),
    subjectList: $("#subjectList"),
    sidePct: $("#sidePct"),
    sideBar: $("#sideBar"),
    sideFoot: $("#sideFoot"),

    activitiesTitle: $("#activitiesTitle"),
    activitiesSub: $("#activitiesSub"),
    activitiesList: $("#activitiesList"),
    completedSub: $("#completedSub"),
    completedList: $("#completedList"),

    calendarTitle: $("#calendarTitle"),
    calendarGrid: $("#calendarGrid"),
    dayTitle: $("#dayTitle"),
    daySub: $("#daySub"),
    calendarDayList: $("#calendarDayList"),
    dayFoot: $("#dayFoot"),
    addOnDayBtn: $("#addOnDayBtn"),
    prevMonth: $("#prevMonth"),
    nextMonth: $("#nextMonth"),
    todayBtn: $("#todayBtn"),

    modal: $("#modal"),
    modalTitle: $("#modalTitle"),
    modalSubtitle: $("#modalSubtitle"),
    form: $("#activityForm"),
    inputTitle: $("#inputTitle"),
    inputSubject: $("#inputSubject"),
    inputType: $("#inputType"),
    inputDate: $("#inputDate"),
    inputNotes: $("#inputNotes"),
    submitBtn: $("#submitBtn"),

    deleteModal: $("#deleteModal"),
    deleteName: $("#deleteName"),
    confirmDelete: $("#confirmDelete"),

    actionMenu: $("#actionMenu"),
    actionToggleLabel: $("#actionToggleLabel"),
    actionToggleIcon: $("#actionToggleIcon"),

    installBtn: $("#installBtn"),
    toast: $("#toast")
  };

  let atividades = [];
  let viewAtual = "dashboard";
  let filtroDashboard = "todas";
  let filtroAtividades = "todas";
  let busca = "";
  let editingId = null;
  let deletingId = null;
  let menuActivityId = null;
  let menuTrigger = null;
  let toastTimer = null;
  let calendarRef = new Date();
  calendarRef.setDate(1);
  let selectedDay = null;
  let lastToday = todayISO();
  let deferredInstallPrompt = null;

  /* ----------------------------------------------------------
     Datas e utilidades
     ---------------------------------------------------------- */

  function toISODate(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }

  function todayISO() {
    return toISODate(new Date());
  }

  function parseISODate(iso) {
    const [ano, mes, dia] = String(iso).split("-").map(Number);
    return new Date(ano, mes - 1, dia);
  }

  function diffDays(iso) {
    const hoje = parseISODate(todayISO());
    const alvo = parseISODate(iso);
    return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
  }

  function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function formatLongDate(iso) {
    return capitalizar(
      parseISODate(iso).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    );
  }

  function formatShortDate(iso) {
    return parseISODate(iso)
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      .replace(/\./g, "");
  }

  function formatMonthTitle(data) {
    return capitalizar(
      data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    );
  }

  function isLate(atividade) {
    return !atividade.concluida && atividade.data < todayISO();
  }

  function gerarId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getAtividade(id) {
    return atividades.find((atividade) => atividade.id === id);
  }

  /* ----------------------------------------------------------
     Persistência
     ---------------------------------------------------------- */

  function normalizarAtividade(item) {
    if (!item || typeof item !== "object") return null;

    const titulo = String(item.titulo || "").trim().slice(0, 80);
    if (!titulo) return null;

    const dataValida =
      typeof item.data === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.data) &&
      !Number.isNaN(parseISODate(item.data).getTime());

    const concluida = Boolean(item.concluida);
    const concluidaEmValida =
      typeof item.concluidaEm === "string" &&
      !Number.isNaN(new Date(item.concluidaEm).getTime());
    const criadaEmValida =
      typeof item.criadaEm === "string" &&
      !Number.isNaN(new Date(item.criadaEm).getTime());

    return {
      id: typeof item.id === "string" && item.id ? item.id : gerarId(),
      titulo,
      descricao: String(item.descricao || "").slice(0, 500),
      materia: MATERIAS[item.materia] ? item.materia : "Outro",
      tipo: TIPOS.includes(item.tipo) ? item.tipo : "Outro",
      data: dataValida ? item.data : todayISO(),
      prioridade: PRIORIDADES[item.prioridade] ? item.prioridade : "media",
      concluida,
      concluidaEm: concluida
        ? concluidaEmValida
          ? new Date(item.concluidaEm).toISOString()
          : new Date().toISOString()
        : null,
      criadaEm: criadaEmValida ? new Date(item.criadaEm).toISOString() : new Date().toISOString()
    };
  }

  function carregarAtividades() {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (!bruto) return [];

      const dados = JSON.parse(bruto);
      if (!Array.isArray(dados)) return [];

      return dados.map(normalizarAtividade).filter(Boolean);
    } catch (erro) {
      console.warn("Não foi possível carregar as atividades.", erro);
      return [];
    }
  }

  function salvarAtividades() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(atividades));
      return true;
    } catch (erro) {
      console.warn("Não foi possível salvar as atividades.", erro);
      toast("Não foi possível salvar. Verifique o armazenamento do navegador.");
      return false;
    }
  }

  /* ----------------------------------------------------------
     Avisos
     ---------------------------------------------------------- */

  function toast(mensagem) {
    el.toast.textContent = mensagem;
    el.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  /* ----------------------------------------------------------
     Navegação entre telas
     ---------------------------------------------------------- */

  function mostrarView(view, opcoes = {}) {
    if (!VIEWS[view]) return;

    viewAtual = view;

    $$(".view").forEach((secao) => {
      secao.hidden = secao.id !== `view-${view}`;
    });

    $$(".nav-item").forEach((item) => {
      const ativo = item.dataset.view === view;
      item.classList.toggle("active", ativo);
      if (ativo) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    el.pageTitle.textContent = VIEWS[view].titulo;
    el.pageCrumb.textContent = VIEWS[view].crumb;
    el.searchInput.placeholder = VIEWS[view].placeholder;

    if (!opcoes.manterBusca) {
      const tinhaBusca = Boolean(busca.trim());
      busca = "";
      el.searchInput.value = "";

      if (tinhaBusca) {
        renderDashboardAtividades();
        renderAtividadesView();
        renderConcluidasView();
      }
    }

    document.title = `OrganizaColégio · ${VIEWS[view].titulo}`;

    fecharMenuAcoes();
    fecharNotificacoes();
    fecharSidebar();

    if (view === "calendario") renderCalendario();

    window.scrollTo(0, 0);
  }

  function setFiltroAtividades(filtro) {
    filtroAtividades = filtro;
    $$("[data-activity-filter]").forEach((botao) => {
      botao.classList.toggle("active", botao.dataset.activityFilter === filtro);
    });
    renderAtividadesView();
  }

  /* ----------------------------------------------------------
     Resumo do Dashboard
     ---------------------------------------------------------- */

  function renderResumo() {
    const total = atividades.length;
    const concluidas = atividades.filter((a) => a.concluida).length;
    const pendentes = total - concluidas;
    const atrasadas = atividades.filter(isLate).length;
    const paraHoje = atividades.filter((a) => !a.concluida && a.data === todayISO()).length;
    const materias = new Set(atividades.map((a) => a.materia)).size;
    const pct = total ? Math.round((concluidas / total) * 100) : 0;

    if (!total) {
      el.welcomeSub.textContent = "Nenhuma atividade cadastrada. Que tal começar agora?";
    } else if (!pendentes) {
      el.welcomeSub.textContent = "Tudo em dia! Você concluiu todas as atividades.";
    } else {
      el.welcomeSub.textContent = `Você tem ${pendentes} ${
        pendentes === 1 ? "atividade pendente" : "atividades pendentes"
      }. Vamos organizar o dia?`;
    }

    el.statTotal.textContent = total;
    el.statTotalNote.textContent = total
      ? `em ${materias} ${materias === 1 ? "matéria" : "matérias"}`
      : "nenhuma atividade ainda";

    el.statDone.textContent = concluidas;
    el.statDoneNote.textContent = `${pct}% do total`;

    el.statPending.textContent = pendentes;
    el.statPendingNote.textContent = paraHoje
      ? `${paraHoje} para hoje`
      : "nada para hoje";

    el.statLate.textContent = atrasadas;
    el.statLateNote.textContent = atrasadas ? "precisa de atenção" : "tudo em dia";
    el.statLateNote.classList.toggle("warn", atrasadas > 0);
    el.statLateNote.classList.toggle("good", atrasadas === 0);

    el.pendingBadge.textContent = pendentes;

    el.progressRing.style.setProperty("--p", pct);
    el.progressValue.textContent = `${pct}%`;
    el.progressRing.setAttribute("aria-label", `${pct}% das tarefas concluídas`);
    el.legendDone.textContent = concluidas;
    el.legendPending.textContent = pendentes;
    el.legendLate.textContent = atrasadas;

    const semana = atividades.filter((a) => {
      if (!a.concluida || !a.concluidaEm) return false;
      const diferenca = Date.now() - new Date(a.concluidaEm).getTime();
      return diferenca >= 0 && diferenca <= 7 * 86400000;
    }).length;

    el.progressTag.textContent = `+${semana}`;
    el.progressTag.title = `${semana} ${
      semana === 1 ? "atividade concluída" : "atividades concluídas"
    } nos últimos 7 dias`;

    if (!total) {
      el.progressNoteText.textContent = "Adicione atividades para acompanhar seu progresso.";
    } else if (!pendentes) {
      el.progressNoteText.textContent = "Tudo concluído! Você está em dia. 🎉";
    } else {
      el.progressNoteText.textContent = `Faltam ${pendentes} ${
        pendentes === 1 ? "tarefa" : "tarefas"
      } para concluir.`;
    }

    el.sidePct.textContent = `${pct}%`;
    el.sideBar.style.width = `${pct}%`;
    el.sideFoot.textContent = total
      ? `${concluidas} de ${total} tarefas`
      : "Nenhuma tarefa ainda";
  }

  function renderMaterias() {
    const mapa = new Map();

    atividades.forEach((atividade) => {
      const atual = mapa.get(atividade.materia) || {
        materia: atividade.materia,
        total: 0,
        concluidas: 0
      };
      atual.total += 1;
      if (atividade.concluida) atual.concluidas += 1;
      mapa.set(atividade.materia, atual);
    });

    const lista = Array.from(mapa.values()).sort(
      (a, b) => b.total - a.total || a.materia.localeCompare(b.materia, "pt-BR")
    );

    el.subjectList.innerHTML = "";

    if (!lista.length) {
      const vazio = document.createElement("div");
      vazio.className = "subject-empty";
      const titulo = document.createElement("strong");
      titulo.textContent = "Nenhuma matéria ainda";
      const texto = document.createElement("span");
      texto.textContent = "Cadastre uma atividade para acompanhar o progresso.";
      vazio.append(titulo, texto);
      el.subjectList.appendChild(vazio);
      return;
    }

    lista.slice(0, 5).forEach((item) => {
      const info = MATERIAS[item.materia] || MATERIAS.Outro;
      const pct = Math.round((item.concluidas / item.total) * 100);

      const linha = document.createElement("div");
      linha.className = "subject";

      const topo = document.createElement("div");
      topo.className = "subject-top";

      const nome = document.createElement("span");
      nome.textContent = item.materia;

      const valor = document.createElement("strong");
      valor.textContent = `${pct}%`;

      topo.append(nome, valor);

      const barra = document.createElement("div");
      barra.className = "bar";

      const preenchimento = document.createElement("span");
      preenchimento.style.width = `${pct}%`;
      preenchimento.style.setProperty("--bar", info.cor);

      barra.appendChild(preenchimento);
      linha.append(topo, barra);
      el.subjectList.appendChild(linha);
    });

    if (lista.length > 5) {
      const restante = document.createElement("div");
      restante.className = "subject-more";
      restante.textContent = `e mais ${lista.length - 5} ${
        lista.length - 5 === 1 ? "matéria" : "matérias"
      }`;
      el.subjectList.appendChild(restante);
    }
  }

  /* ----------------------------------------------------------
     Listas de atividades
     ---------------------------------------------------------- */

  function combinaBusca(atividade) {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;

    return [atividade.titulo, atividade.materia, atividade.tipo, atividade.descricao].some(
      (valor) => String(valor || "").toLowerCase().includes(termo)
    );
  }

  function ordenarPendentes(a, b) {
    const porData = a.data.localeCompare(b.data);
    if (porData !== 0) return porData;
    return PRIORIDADES[b.prioridade].peso - PRIORIDADES[a.prioridade].peso;
  }

  function ordenarAtividades(a, b) {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    if (!a.concluida) return ordenarPendentes(a, b);

    const dataA = a.concluidaEm ? new Date(a.concluidaEm).getTime() : 0;
    const dataB = b.concluidaEm ? new Date(b.concluidaEm).getTime() : 0;
    return dataB - dataA;
  }

  function infoPrazo(atividade) {
    if (atividade.concluida) {
      return {
        rotulo: "Concluída",
        classe: "done",
        titulo: atividade.concluidaEm
          ? `Concluída em ${new Date(atividade.concluidaEm).toLocaleDateString("pt-BR")}`
          : "Atividade concluída"
      };
    }

    const diferenca = diffDays(atividade.data);

    if (diferenca < 0) {
      return {
        rotulo: "Atrasada",
        classe: "late",
        titulo: `Venceu em ${formatShortDate(atividade.data)}`
      };
    }

    if (diferenca === 0) {
      return { rotulo: "Hoje", classe: "today", titulo: "Entrega hoje" };
    }

    if (diferenca === 1) {
      return { rotulo: "Amanhã", classe: "soon", titulo: "Entrega amanhã" };
    }

    return {
      rotulo: formatShortDate(atividade.data),
      classe: diferenca <= 3 ? "soon" : "later",
      titulo: `Entrega em ${formatLongDate(atividade.data)}`
    };
  }

  function criarVazio(opcoes) {
    const vazio = document.createElement("div");
    vazio.className = "empty";

    const icone = document.createElement("span");
    icone.className = "empty-icon";
    icone.innerHTML = '<svg class="icon"><use href="#i-inbox"></use></svg>';

    const titulo = document.createElement("strong");
    titulo.textContent = opcoes.titulo || "Nenhuma atividade por aqui";

    const texto = document.createElement("p");
    texto.textContent = opcoes.texto || "Ajuste os filtros ou adicione uma nova tarefa.";

    vazio.append(icone, titulo, texto);

    if (opcoes.botao) {
      const acoes = document.createElement("div");
      acoes.className = "empty-actions";

      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "btn primary";
      botao.setAttribute("data-add", "");
      if (opcoes.data) botao.dataset.date = opcoes.data;
      botao.innerHTML =
        '<svg class="icon"><use href="#i-plus"></use></svg>Nova atividade';

      acoes.appendChild(botao);
      vazio.appendChild(acoes);
    }

    return vazio;
  }

  function renderLista(container, lista, opcoes) {
    container.innerHTML = "";

    if (!lista.length) {
      container.appendChild(criarVazio(opcoes));
      return;
    }

    const fragmento = document.createDocumentFragment();
    lista.forEach((atividade) => {
      fragmento.appendChild(criarItemAtividade(atividade));
    });
    container.appendChild(fragmento);
  }

  function criarItemAtividade(atividade) {
    const info = MATERIAS[atividade.materia] || MATERIAS.Outro;
    const prazo = infoPrazo(atividade);

    const item = document.createElement("article");
    item.className = "activity";
    if (atividade.concluida) item.classList.add("done");
    if (isLate(atividade)) item.classList.add("late");
    item.dataset.id = atividade.id;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "check";
    check.setAttribute(
      "aria-label",
      atividade.concluida
        ? `Reabrir "${atividade.titulo}"`
        : `Concluir "${atividade.titulo}"`
    );
    check.innerHTML = '<svg class="icon"><use href="#i-check"></use></svg>';
    check.addEventListener("click", () => alternarConclusao(atividade.id));

    const icone = document.createElement("span");
    icone.className = "activity-icon";
    icone.style.setProperty("--sc", info.cor);
    icone.style.setProperty("--sc-bg", info.bg);
    icone.setAttribute("aria-hidden", "true");
    icone.textContent = atividade.materia.slice(0, 3).toUpperCase();

    const principal = document.createElement("div");
    principal.className = "activity-main";

    const linhaTitulo = document.createElement("div");
    linhaTitulo.className = "activity-title";

    const titulo = document.createElement("h4");
    titulo.textContent = atividade.titulo;
    if (atividade.descricao) titulo.title = atividade.descricao;

    const prioridade = document.createElement("span");
    prioridade.className = `priority ${atividade.prioridade}`;
    prioridade.textContent = PRIORIDADES[atividade.prioridade].rotulo;

    linhaTitulo.append(titulo, prioridade);

    const meta = document.createElement("div");
    meta.className = "activity-meta";

    const materia = document.createElement("strong");
    materia.textContent = atividade.materia;

    const ponto = document.createElement("span");
    ponto.className = "meta-dot";
    ponto.setAttribute("aria-hidden", "true");

    const tipo = document.createElement("span");
    tipo.textContent = atividade.tipo;

    meta.append(materia, ponto, tipo);
    principal.append(linhaTitulo, meta);

    const lado = document.createElement("div");
    lado.className = "activity-side";

    const prazoChip = document.createElement("span");
    prazoChip.className = `due ${prazo.classe}`;
    prazoChip.textContent = prazo.rotulo;
    prazoChip.title = prazo.titulo;

    const mais = document.createElement("button");
    mais.type = "button";
    mais.className = "more";
    mais.setAttribute("aria-label", `Mais opções de "${atividade.titulo}"`);
    mais.setAttribute("aria-haspopup", "menu");
    mais.setAttribute("aria-expanded", "false");
    mais.innerHTML = '<svg class="icon"><use href="#i-more"></use></svg>';
    mais.addEventListener("click", (evento) => {
      evento.stopPropagation();
      abrirMenuAcoes(atividade.id, mais);
    });

    lado.append(prazoChip, mais);
    item.append(check, icone, principal, lado);

    return item;
  }

  function renderDashboardAtividades() {
    const hoje = todayISO();
    const totalPendentes = atividades.filter((a) => !a.concluida).length;

    let lista = atividades.filter((a) => !a.concluida);

    if (filtroDashboard === "hoje") {
      lista = lista.filter((a) => a.data === hoje);
    } else if (filtroDashboard === "semana") {
      lista = lista.filter((a) => a.data >= hoje && diffDays(a.data) <= 7);
    }

    lista = lista.filter(combinaBusca).sort(ordenarPendentes);

    const filtrando = filtroDashboard !== "todas" || Boolean(busca.trim());

    renderLista(el.activityList, lista, {
      titulo: filtrando
        ? "Nenhuma atividade encontrada"
        : atividades.length
          ? "Tudo em dia!"
          : "Nenhuma atividade ainda",
      texto: filtrando
        ? "Ajuste os filtros ou a busca para ver outras atividades."
        : atividades.length
          ? "Você não tem atividades pendentes no momento."
          : "Adicione sua primeira atividade para começar.",
      botao: true
    });

    if (filtrando) {
      el.upcomingSub.textContent = `${lista.length} ${
        lista.length === 1 ? "resultado" : "resultados"
      }`;
    } else {
      el.upcomingSub.textContent = totalPendentes
        ? `${totalPendentes} ${totalPendentes === 1 ? "tarefa pendente" : "tarefas pendentes"}`
        : "Nenhuma tarefa pendente";
    }
  }

  function renderAtividadesView() {
    const total = atividades.length;
    let lista = [...atividades];

    if (filtroAtividades === "pendentes") {
      lista = lista.filter((a) => !a.concluida);
      el.activitiesTitle.textContent = "Atividades pendentes";
    } else if (filtroAtividades === "concluidas") {
      lista = lista.filter((a) => a.concluida);
      el.activitiesTitle.textContent = "Atividades concluídas";
    } else {
      el.activitiesTitle.textContent = "Todas as atividades";
    }

    lista = lista.filter(combinaBusca).sort(ordenarAtividades);

    let tituloVazio = "Nenhuma atividade por aqui";
    let textoVazio = "Adicione sua primeira atividade para começar.";

    if (total) {
      if (filtroAtividades === "pendentes") {
        tituloVazio = "Nenhuma atividade pendente";
        textoVazio = "Tudo em dia! Suas atividades estão concluídas.";
      } else if (filtroAtividades === "concluidas") {
        tituloVazio = "Nenhuma atividade concluída";
        textoVazio = "Marque uma atividade como concluída para vê-la aqui.";
      } else if (busca.trim()) {
        tituloVazio = "Nenhuma atividade encontrada";
        textoVazio = "Tente buscar por outro título, matéria ou tipo.";
      }
    }

    renderLista(el.activitiesList, lista, {
      titulo: tituloVazio,
      texto: textoVazio,
      botao: !total || (filtroAtividades === "todas" && !busca.trim())
    });

    el.activitiesSub.textContent = total
      ? `${lista.length} de ${total} ${total === 1 ? "atividade" : "atividades"}`
      : "Nenhuma atividade cadastrada";
  }

  function renderConcluidasView() {
    let lista = atividades.filter((a) => a.concluida).filter(combinaBusca);
    lista.sort(ordenarAtividades);

    renderLista(el.completedList, lista, {
      titulo: busca.trim() ? "Nenhuma atividade encontrada" : "Nenhuma atividade concluída",
      texto: busca.trim()
        ? "Tente buscar por outro título, matéria ou tipo."
        : "Marque uma atividade como concluída para vê-la aqui.",
      botao: false
    });

    el.completedSub.textContent = `${lista.length} ${
      lista.length === 1 ? "atividade" : "atividades"
    }`;
  }

  /* ----------------------------------------------------------
     Calendário
     ---------------------------------------------------------- */

  function renderCalendario() {
    const ano = calendarRef.getFullYear();
    const mes = calendarRef.getMonth();
    const hoje = todayISO();

    el.calendarTitle.textContent = formatMonthTitle(calendarRef);

    const primeiroDia = new Date(ano, mes, 1);
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const inicioSemana = primeiroDia.getDay();
    const totalCelulas = Math.ceil((inicioSemana + diasNoMes) / 7) * 7;
    const inicio = new Date(ano, mes, 1 - inicioSemana);

    el.calendarGrid.innerHTML = "";

    for (let indice = 0; indice < totalCelulas; indice += 1) {
      const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice);
      const iso = toISODate(data);
      const doMes = data.getMonth() === mes;
      const tarefas = atividades.filter((a) => a.data === iso);
      const pendentes = tarefas.filter((a) => !a.concluida);
      const atrasadas = tarefas.filter(isLate);

      const dia = document.createElement("button");
      dia.type = "button";
      dia.className = "cal-day";
      dia.setAttribute("role", "gridcell");
      dia.setAttribute("aria-selected", iso === selectedDay ? "true" : "false");
      if (!doMes) dia.classList.add("outside");
      if (iso === hoje) dia.classList.add("today");
      if (iso === selectedDay) dia.classList.add("selected");

      const resumo = tarefas.length
        ? `${tarefas.length} ${tarefas.length === 1 ? "atividade" : "atividades"}` +
          (pendentes.length ? `, ${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}` : "") +
          (atrasadas.length ? `, ${atrasadas.length} atrasada${atrasadas.length === 1 ? "" : "s"}` : "")
        : "nenhuma atividade";

      dia.setAttribute("aria-label", `${formatLongDate(iso)}: ${resumo}`);
      dia.title = `${formatLongDate(iso)} · ${resumo}`;

      const numero = document.createElement("span");
      numero.className = "cal-number";
      numero.textContent = data.getDate();

      const pontos = document.createElement("span");
      pontos.className = "cal-dots";
      pontos.setAttribute("aria-hidden", "true");

      tarefas.slice(0, 3).forEach((tarefa) => {
        const ponto = document.createElement("span");
        ponto.className = "cal-dot";
        if (tarefa.concluida) ponto.classList.add("done");
        else if (isLate(tarefa)) ponto.classList.add("late");
        pontos.appendChild(ponto);
      });

      if (tarefas.length > 3) {
        const mais = document.createElement("span");
        mais.className = "cal-more";
        mais.textContent = `+${tarefas.length - 3}`;
        pontos.appendChild(mais);
      }

      dia.append(numero, pontos);

      dia.addEventListener("click", () => {
        selectedDay = iso;
        if (!doMes) {
          calendarRef = new Date(data.getFullYear(), data.getMonth(), 1);
        }
        renderCalendario();
      });

      el.calendarGrid.appendChild(dia);
    }

    renderDiaSelecionado();
  }

  function renderDiaSelecionado() {
    if (!selectedDay) {
      el.dayTitle.textContent = "Atividades do dia";
      el.daySub.textContent = "Selecione um dia no calendário";
      el.dayFoot.hidden = true;
      el.addOnDayBtn.removeAttribute("data-date");
      renderLista(el.calendarDayList, [], {
        titulo: "Nenhum dia selecionado",
        texto: "Clique em uma data para ver as atividades.",
        botao: false
      });
      return;
    }

    el.dayTitle.textContent = formatLongDate(selectedDay);
    el.dayFoot.hidden = false;
    el.addOnDayBtn.dataset.date = selectedDay;

    let lista = atividades.filter((a) => a.data === selectedDay).filter(combinaBusca);
    lista.sort(ordenarAtividades);

    el.daySub.textContent = lista.length
      ? `${lista.length} ${lista.length === 1 ? "atividade" : "atividades"}`
      : "Nenhuma atividade";

    renderLista(el.calendarDayList, lista, {
      titulo: busca.trim() ? "Nenhuma atividade encontrada" : "Nenhuma atividade neste dia",
      texto: busca.trim()
        ? "Tente buscar por outro título, matéria ou tipo."
        : "Aproveite para adicionar uma nova tarefa.",
      botao: true,
      data: selectedDay
    });
  }

  /* ----------------------------------------------------------
     Notificações
     ---------------------------------------------------------- */

  function criarSecaoNotificacao(titulo, lista, tipo) {
    if (!lista.length) return null;

    const secao = document.createElement("div");
    secao.className = "notif-section";

    const rotulo = document.createElement("span");
    rotulo.className = "notif-label";
    rotulo.textContent = `${titulo} (${lista.length})`;
    secao.appendChild(rotulo);

    lista.forEach((atividade) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "notif-item";

      const icone = document.createElement("span");
      icone.className = `notif-item-icon${tipo === "today" ? " today" : ""}`;
      icone.innerHTML = `<svg class="icon"><use href="#${
        tipo === "today" ? "i-clock" : "i-alert"
      }"></use></svg>`;

      const texto = document.createElement("span");
      texto.className = "notif-item-text";

      const nome = document.createElement("strong");
      nome.textContent = atividade.titulo;

      const detalhe = document.createElement("span");
      detalhe.textContent = `${atividade.materia} · ${
        tipo === "today" ? "Entrega hoje" : `Venceu em ${formatShortDate(atividade.data)}`
      }`;

      texto.append(nome, detalhe);
      item.append(icone, texto);

      item.addEventListener("click", () => {
        fecharNotificacoes();
        abrirModalAtividade(atividade);
      });

      secao.appendChild(item);
    });

    return secao;
  }

  function renderNotificacoes() {
    const atrasadas = atividades.filter(isLate).sort(ordenarPendentes);
    const hoje = atividades
      .filter((a) => !a.concluida && a.data === todayISO())
      .sort(ordenarPendentes);
    const total = atrasadas.length + hoje.length;

    el.notifBtn.classList.toggle("has-dot", total > 0);
    el.notifCount.textContent = total;
    el.notifBody.innerHTML = "";

    if (!total) {
      const vazio = document.createElement("div");
      vazio.className = "notif-empty";
      vazio.innerHTML =
        '<svg class="icon"><use href="#i-sparkles"></use></svg>' +
        "<span>Tudo em dia! Nenhuma atividade atrasada ou para hoje.</span>";
      el.notifBody.appendChild(vazio);
      return;
    }

    const secaoAtrasadas = criarSecaoNotificacao("Atrasadas", atrasadas, "late");
    const secaoHoje = criarSecaoNotificacao("Para hoje", hoje, "today");

    if (secaoAtrasadas) el.notifBody.appendChild(secaoAtrasadas);
    if (secaoHoje) el.notifBody.appendChild(secaoHoje);
  }

  function abrirNotificacoes() {
    if (!el.notifPopover.hidden) {
      fecharNotificacoes();
      return;
    }

    fecharMenuAcoes();
    el.notifPopover.hidden = false;
    el.notifBtn.setAttribute("aria-expanded", "true");
  }

  function fecharNotificacoes() {
    el.notifPopover.hidden = true;
    el.notifBtn.setAttribute("aria-expanded", "false");
  }

  /* ----------------------------------------------------------
     Menu de ações
     ---------------------------------------------------------- */

  function abrirMenuAcoes(id, botao) {
    if (menuActivityId === id && !el.actionMenu.hidden) {
      fecharMenuAcoes();
      return;
    }

    const atividade = getAtividade(id);
    if (!atividade) return;

    fecharNotificacoes();
    fecharMenuAcoes();

    menuActivityId = id;
    menuTrigger = botao;

    el.actionToggleLabel.textContent = atividade.concluida ? "Reabrir" : "Concluir";
    el.actionToggleIcon.innerHTML = `<use href="#${
      atividade.concluida ? "i-rotate" : "i-check"
    }"></use>`;

    el.actionMenu.hidden = false;
    botao.setAttribute("aria-expanded", "true");

    const retangulo = botao.getBoundingClientRect();
    const menu = el.actionMenu.getBoundingClientRect();

    let esquerda = Math.min(
      retangulo.right - menu.width,
      window.innerWidth - menu.width - 12
    );
    esquerda = Math.max(12, esquerda);

    let topo = retangulo.bottom + 6;
    if (topo + menu.height > window.innerHeight - 12) {
      topo = Math.max(12, retangulo.top - menu.height - 6);
    }

    el.actionMenu.style.left = `${esquerda}px`;
    el.actionMenu.style.top = `${topo}px`;
  }

  function fecharMenuAcoes() {
    el.actionMenu.hidden = true;
    if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger = null;
    menuActivityId = null;
  }

  /* ----------------------------------------------------------
     Modal de atividade
     ---------------------------------------------------------- */

  function travarRolagem() {
    const aberto =
      el.modal.classList.contains("open") ||
      el.deleteModal.classList.contains("open") ||
      el.sidebar.classList.contains("open");
    document.body.classList.toggle("no-scroll", aberto);
  }

  function abrirModalAtividade(atividade = null, dataPadrao = null) {
    editingId = atividade ? atividade.id : null;

    el.form.reset();
    el.modalTitle.textContent = atividade ? "Editar atividade" : "Nova atividade";
    el.modalSubtitle.textContent = atividade
      ? "Atualize os dados da atividade."
      : "Organize o que precisa ser feito.";
    el.submitBtn.textContent = atividade ? "Salvar alterações" : "Adicionar atividade";

    if (atividade) {
      el.inputTitle.value = atividade.titulo;
      el.inputSubject.value = atividade.materia;
      el.inputType.value = atividade.tipo;
      el.inputDate.value = atividade.data;
      el.inputNotes.value = atividade.descricao || "";

      const prioridade = el.form.querySelector(
        `input[name="prioridade"][value="${atividade.prioridade}"]`
      );
      if (prioridade) prioridade.checked = true;
    } else {
      el.inputDate.value = dataPadrao || todayISO();
    }

    el.modal.classList.add("open");
    el.modal.setAttribute("aria-hidden", "false");
    travarRolagem();
    window.setTimeout(() => el.inputTitle.focus(), 80);
  }

  function fecharModalAtividade() {
    el.modal.classList.remove("open");
    el.modal.setAttribute("aria-hidden", "true");
    editingId = null;
    travarRolagem();
  }

  function abrirConfirmacaoExclusao(id) {
    const atividade = getAtividade(id);
    if (!atividade) return;

    deletingId = id;
    el.deleteName.textContent = `"${atividade.titulo}"`;
    el.deleteModal.classList.add("open");
    el.deleteModal.setAttribute("aria-hidden", "false");
    travarRolagem();
    window.setTimeout(() => el.confirmDelete.focus(), 80);
  }

  function fecharConfirmacaoExclusao() {
    el.deleteModal.classList.remove("open");
    el.deleteModal.setAttribute("aria-hidden", "true");
    deletingId = null;
    travarRolagem();
  }

  /* ----------------------------------------------------------
     Operações com atividades
     ---------------------------------------------------------- */

  function alternarConclusao(id) {
    const atividade = getAtividade(id);
    if (!atividade) return;

    atividade.concluida = !atividade.concluida;
    atividade.concluidaEm = atividade.concluida ? new Date().toISOString() : null;

    salvarAtividades();
    renderTudo();
    toast(
      atividade.concluida
        ? "Boa! Atividade concluída. 🎉"
        : "Atividade reaberta. Ela voltou para as pendentes."
    );
  }

  function excluirAtividade(id) {
    const atividade = getAtividade(id);
    if (!atividade) return;

    atividades = atividades.filter((a) => a.id !== id);
    salvarAtividades();
    renderTudo();
    toast(`"${atividade.titulo}" foi excluída.`);
  }

  function salvarFormulario(evento) {
    evento.preventDefault();

    const titulo = el.inputTitle.value.trim();
    const materia = el.inputSubject.value;
    const tipo = el.inputType.value;
    const data = el.inputDate.value;

    if (!titulo) {
      el.inputTitle.focus();
      return;
    }

    if (!materia || !tipo) {
      toast("Selecione a matéria e o tipo da atividade.");
      return;
    }

    if (!data) {
      toast("Informe a data de entrega.");
      return;
    }

    const prioridade =
      el.form.querySelector('input[name="prioridade"]:checked')?.value || "media";

    const dados = {
      titulo,
      materia,
      tipo,
      data,
      prioridade,
      descricao: el.inputNotes.value.trim().slice(0, 500)
    };

    if (editingId) {
      const atividade = getAtividade(editingId);
      if (!atividade) {
        fecharModalAtividade();
        return;
      }
      Object.assign(atividade, dados);
      salvarAtividades();
      toast("Atividade atualizada com sucesso.");
    } else {
      atividades.push({
        id: gerarId(),
        ...dados,
        concluida: false,
        concluidaEm: null,
        criadaEm: new Date().toISOString()
      });
      salvarAtividades();
      toast("Atividade adicionada com sucesso.");
    }

    if (viewAtual === "calendario") {
      selectedDay = data;
      calendarRef = parseISODate(data);
      calendarRef.setDate(1);
    }

    fecharModalAtividade();
    renderTudo();
  }

  /* ----------------------------------------------------------
     Instalação (PWA)
     ---------------------------------------------------------- */

  function estaInstalado() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function ehIOS() {
    return (
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
    );
  }

  function atualizarBotaoInstalacao() {
    const instalado = estaInstalado();
    const podeInstalar = Boolean(deferredInstallPrompt) || (ehIOS() && !instalado);
    el.installBtn.hidden = instalado || !podeInstalar;
  }

  async function instalarAplicativo() {
    if (estaInstalado()) {
      toast("O OrganizaColégio já está instalado.");
      return;
    }

    if (!deferredInstallPrompt) {
      toast(
        ehIOS()
          ? "No Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”."
          : "Abra o menu do navegador e escolha “Instalar aplicativo”."
      );
      return;
    }

    const prompt = deferredInstallPrompt;
    deferredInstallPrompt = null;

    try {
      prompt.prompt();
      const escolha = await prompt.userChoice;
      el.installBtn.hidden = true;

      if (escolha.outcome === "accepted") {
        toast("Instalando o OrganizaColégio…");
      } else {
        toast("Instalação cancelada.");
      }
    } catch (erro) {
      toast("Não foi possível iniciar a instalação. Use o menu do navegador.");
    }
  }

  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    deferredInstallPrompt = evento;
    atualizarBotaoInstalacao();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    el.installBtn.hidden = true;
    toast("OrganizaColégio instalado com sucesso!");
  });

  const displayMode = window.matchMedia("(display-mode: standalone)");
  if (typeof displayMode.addEventListener === "function") {
    displayMode.addEventListener("change", atualizarBotaoInstalacao);
  }

  el.installBtn.addEventListener("click", instalarAplicativo);

  /* ----------------------------------------------------------
     Menu lateral mobile
     ---------------------------------------------------------- */

  function abrirSidebar() {
    el.sidebar.classList.add("open");
    el.scrim.classList.add("show");
    el.menuBtn.setAttribute("aria-expanded", "true");
    travarRolagem();
  }

  function fecharSidebar() {
    el.sidebar.classList.remove("open");
    el.scrim.classList.remove("show");
    el.menuBtn.setAttribute("aria-expanded", "false");
    travarRolagem();
  }

  /* ----------------------------------------------------------
     Renderização geral
     ---------------------------------------------------------- */

  function renderTudo() {
    if (!el.actionMenu.hidden) fecharMenuAcoes();

    renderResumo();
    renderMaterias();
    renderDashboardAtividades();
    renderAtividadesView();
    renderConcluidasView();
    renderCalendario();
    renderNotificacoes();
  }

  /* ----------------------------------------------------------
     Eventos
     ---------------------------------------------------------- */

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => mostrarView(item.dataset.view));
  });

  el.brandLink.addEventListener("click", (evento) => {
    evento.preventDefault();
    mostrarView("dashboard");
  });

  el.menuBtn.addEventListener("click", () => {
    if (el.sidebar.classList.contains("open")) fecharSidebar();
    else abrirSidebar();
  });

  el.scrim.addEventListener("click", fecharSidebar);

  el.notifBtn.addEventListener("click", abrirNotificacoes);

  el.notifSeeAll.addEventListener("click", () => {
    fecharNotificacoes();
    setFiltroAtividades("pendentes");
    mostrarView("atividades");
  });

  el.searchInput.addEventListener("input", (evento) => {
    busca = evento.target.value;
    renderDashboardAtividades();
    renderAtividadesView();
    renderConcluidasView();
    renderDiaSelecionado();
  });

  $$("[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      filtroDashboard = chip.dataset.filter;
      $$("[data-filter]").forEach((outro) => {
        outro.classList.toggle("active", outro.dataset.filter === filtroDashboard);
      });
      renderDashboardAtividades();
    });
  });

  $$("[data-activity-filter]").forEach((chip) => {
    chip.addEventListener("click", () => setFiltroAtividades(chip.dataset.activityFilter));
  });

  el.seeAllBtn.addEventListener("click", () => {
    setFiltroAtividades("todas");
    mostrarView("atividades");
  });

  el.addOnDayBtn.addEventListener("click", () => {
    if (!selectedDay) return;
    abrirModalAtividade(null, selectedDay);
  });

  el.prevMonth.addEventListener("click", () => {
    calendarRef = new Date(calendarRef.getFullYear(), calendarRef.getMonth() - 1, 1);
    selectedDay = null;
    renderCalendario();
  });

  el.nextMonth.addEventListener("click", () => {
    calendarRef = new Date(calendarRef.getFullYear(), calendarRef.getMonth() + 1, 1);
    selectedDay = null;
    renderCalendario();
  });

  el.todayBtn.addEventListener("click", () => {
    const hoje = new Date();
    calendarRef = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    selectedDay = todayISO();
    renderCalendario();
  });

  el.actionMenu.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-action]");
    if (!botao) return;

    const id = menuActivityId;
    const acao = botao.dataset.action;
    fecharMenuAcoes();

    if (!id) return;

    if (acao === "edit") {
      abrirModalAtividade(getAtividade(id));
    } else if (acao === "toggle") {
      alternarConclusao(id);
    } else if (acao === "delete") {
      abrirConfirmacaoExclusao(id);
    }
  });

  el.form.addEventListener("submit", salvarFormulario);

  el.confirmDelete.addEventListener("click", () => {
    if (!deletingId) return;
    const id = deletingId;
    fecharConfirmacaoExclusao();
    excluirAtividade(id);
  });

  $$("[data-close]").forEach((botao) => {
    botao.addEventListener("click", fecharModalAtividade);
  });

  $$("[data-close-delete]").forEach((botao) => {
    botao.addEventListener("click", fecharConfirmacaoExclusao);
  });

  el.modal.addEventListener("click", (evento) => {
    if (evento.target === el.modal) fecharModalAtividade();
  });

  el.deleteModal.addEventListener("click", (evento) => {
    if (evento.target === el.deleteModal) fecharConfirmacaoExclusao();
  });

  document.addEventListener("click", (evento) => {
    const botaoAdicionar = evento.target.closest("[data-add]");
    if (botaoAdicionar) {
      evento.preventDefault();
      fecharMenuAcoes();
      fecharNotificacoes();
      abrirModalAtividade(null, botaoAdicionar.dataset.date || null);
      return;
    }

    if (!el.notifPopover.hidden && !evento.target.closest(".notif-wrap")) {
      fecharNotificacoes();
    }

    if (
      !el.actionMenu.hidden &&
      !evento.target.closest("#actionMenu") &&
      !evento.target.closest(".more")
    ) {
      fecharMenuAcoes();
    }
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;

    if (el.modal.classList.contains("open")) {
      fecharModalAtividade();
    } else if (el.deleteModal.classList.contains("open")) {
      fecharConfirmacaoExclusao();
    } else if (!el.actionMenu.hidden) {
      fecharMenuAcoes();
    } else if (!el.notifPopover.hidden) {
      fecharNotificacoes();
    } else if (el.sidebar.classList.contains("open")) {
      fecharSidebar();
    }
  });

  window.addEventListener("scroll", () => {
    if (!el.actionMenu.hidden) fecharMenuAcoes();
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (!el.actionMenu.hidden) fecharMenuAcoes();
    if (window.innerWidth > 1024 && el.sidebar.classList.contains("open")) {
      fecharSidebar();
    }
  });

  window.addEventListener("storage", (evento) => {
    if (evento.key !== STORAGE_KEY) return;
    atividades = carregarAtividades();
    renderTudo();
  });

  /* ----------------------------------------------------------
     Inicialização
     ---------------------------------------------------------- */

  function atualizarDataAtual() {
    const dataAtual = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
    el.todayLabel.textContent = capitalizar(dataAtual);
  }

  function iniciar() {
    atualizarDataAtual();

    atividades = carregarAtividades();
    selectedDay = todayISO();
    calendarRef = new Date();
    calendarRef.setDate(1);

    el.searchInput.value = "";
    busca = "";

    renderTudo();
    atualizarBotaoInstalacao();

    window.setInterval(() => {
      const hoje = todayISO();
      if (hoje === lastToday) return;

      if (selectedDay === lastToday) selectedDay = hoje;
      lastToday = hoje;
      atualizarDataAtual();
      renderTudo();
    }, 60000);

    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("service-worker.js").catch(() => {
          /* O service worker é opcional. */
        });
      });
    }
  }

  iniciar();
})();
