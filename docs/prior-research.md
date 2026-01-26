# 先行研究・事例調査レポート

## マルチエージェントAI討論・合議システムに関する調査

**調査日:** 2026-01-27
**対象期間:** 2023〜2026年の論文・プロジェクト
**目的:** connpute-gikai（AI議会式意思決定システム）の設計に活用できる知見の収集

---

## 目次

1. [直接的な先行プロジェクト](#1-直接的な先行プロジェクト)
2. [学術研究: マルチエージェント討論 (MAD)](#2-学術研究-マルチエージェント討論-mad)
3. [議論の失敗モード: 忖度・同調問題](#3-議論の失敗モード-忖度同調問題)
4. [緩和手法](#4-緩和手法)
5. [投票・合意形成プロトコルの比較研究](#5-投票合意形成プロトコルの比較研究)
6. [connpute-gikai への設計示唆](#6-connpute-gikai-への設計示唆)
7. [参考文献一覧](#7-参考文献一覧)

---

## 1. 直接的な先行プロジェクト

### 1.1 LLM Council (Andrej Karpathy, 2025)

connpute-gikai の構想に最も近い既存実装。Karpathy が「週末ハック」として作成し、GitHub で 11,500+ stars を獲得。

**アーキテクチャ:**
- FastAPI バックエンド + OpenRouter クライアント + JSON-on-disk ストア
- 中央のオーケストレーター (`council.py`) が3段階のワークフローを制御

**3段階ワークフロー:**

| 段階 | 内容 |
|------|------|
| Stage 1: First Opinions | 全LLMに個別に質問し、各回答を収集 |
| Stage 2: Peer Review | 各LLMが他のLLMの回答をレビュー（**匿名化済み**） |
| Stage 3: Consensus | 「議長」モデルが全データを統合し最終回答を生成 |

**設計上の特徴:**
- ピアレビュー時にモデルの身元を匿名化し、「知名度バイアス」を排除
- 重量級フレームワーク（LangChain, CrewAI等）を使わず軽量に実装
- 異なるモデルの使用により「seed bias」を軽減（異なる重み・学習データ・RLHFから自然な視点の差が生まれる）

**制限事項:**
- 合議の品質は議長モデルの能力に依存
- 全モデルの応答を待つためレイテンシが増加
- コストがモデル数に比例して増加

**connpute-gikai との差異:**
- 党派制がない（全エージェントが中立的に回答）
- 投票・採決の仕組みがない
- 「議論」よりも「レビュー」に近い構造
- 議事録の概念がない

**参考:**
- GitHub: https://github.com/karpathy/llm-council
- 解説: https://www.analyticsvidhya.com/blog/2025/12/llm-council-by-andrej-karpathy/

---

### 1.2 SocraSynth / MACI (Edward Y. Chang, Stanford)

スタンフォード大学の Chang 教授による多年にわたる研究プロジェクト。ソクラテス式対話をマルチLLMに適用。

**コアメカニズム:**
- 2つのLLMエージェントが対立する立場で議論
- 人間のモデレーターが「対立度 (contentiousness)」レベルを調整
- 条件付き統計と体系的なコンテキスト強化を使用

**2フェーズアーキテクチャ:**

| フェーズ | 内容 |
|---------|------|
| 知識生成 | モデレーターが議題と対立度を定義。各エージェントが自身の立場を支持する論拠を構築 |
| 推論評価 | ソクラテス式推論と形式論理の原則に基づき、論拠の質を評価 |

対話の最後に、モデレーターが対立度を「対立的→協調的」に調整し、最終的な和解的意見を収集して人間の意思決定を支援する。

**役割分担:**
- 人間 → モデレーター（議題設定、対立度調整）
- LLMエージェント → 知識生成（対立する2つの立場）
- LLM審判 → 評価
- 人間幹部 → 最終決定

**MACI への進化:**
SocraSynth は後に **MACI (Multi-LLM Agent Collaborative Intelligence)** フレームワークへ発展。意識モデリング、批判的読解分析 (CRIT)、行動感情分析 (BEAM)、エントロピー支配型多エージェント討論 (EVINCE) など9つの研究基盤を統合。

**connpute-gikai への示唆:**
- 「対立度」パラメータの導入（議論の雰囲気制御）
- 対立的→協調的への段階的移行が有効
- 人間がモデレーターとして関与する設計パターン

**参考:**
- プロジェクトページ: http://infolab.stanford.edu/~echang/SocraSynth.html
- 論文: https://arxiv.org/abs/2402.06634

---

### 1.3 AI-Parliament (IRJMETS)

LLMペルソナを用いた議会シミュレーションフレームワーク。

**構成:**
- LLM生成のペルソナで政党と議員を表現
- エージェントが議題に対して意見を表明
- コーディネーターが意見を集約し、Yes/No の投票質問を策定
- グループ討議の結果を基に投票

**評価:**
計算社会科学、意思決定支援システム、AI駆動型ガバナンスモデルとしての可能性と限界を分析。

**connpute-gikai との類似点:**
- 政党の概念がある
- 投票メカニズムがある
- 議員ペルソナをLLMで表現

**参考:**
- 論文: https://www.irjmets.com/upload_newfiles/irjmets71100140692/paper_file/irjmets71100140692.pdf

---

### 1.4 Council AI (商用プラットフォーム)

LLM Council の概念を商用化したプラットフォーム。

- 30+ のLLMが協調して回答
- GPT, Claude, Gemini 等を含む
- 討論・分析・合意形成のプロセスを提供
- 単一AIが見落とす盲点を発見することを目的とする

**参考:** https://council-ai.app/

---

### 1.5 オープンソースフレームワーク

| プロジェクト | 概要 | URL |
|---|---|---|
| **ChatEval** (THUNLP) | ペルソナ付き多エージェント討論。評価タスク向け。多様なロールプロンプトが性能に重要と報告 | https://github.com/thunlp/ChatEval |
| **DebateLLM** (InstaDeep) | 6つの議論戦略（Society of Minds, Medprompt, Multi-Persona, Ensemble Refinement, ChatEval, Solo Performance Prompting）のベンチマーク実装 | https://github.com/instadeepai/DebateLLM |

---

## 2. 学術研究: マルチエージェント討論 (MAD)

### 2.1 MADフレームワークの起源

**"Encouraging Divergent Thinking in LLMs through Multi-Agent Debate"**
Liang et al., EMNLP 2024

LLMの「思考の退化 (Degeneration of Thought)」問題に対処するため、MADフレームワークを提案。複数のエージェントが「しっぺ返し (tit for tat)」の状態で論拠を述べ、審判が議論プロセスを管理して最終解を得る。

- 多様なロールプロンプト（異なるペルソナ）が討論において不可欠
- 同一ロールの使用は性能劣化につながる

**参考:** https://aclanthology.org/2024.emnlp-main.992/

---

### 2.2 多様性が推論を強化する

**"Diversity of Thought Elicits Stronger Reasoning Capabilities in Multi-Agent Debate Frameworks"**
Hegazy et al., 2024

Du et al. のMADフレームワークを拡張し、モデルの多様性が推論能力に与える影響を検証。

**主要知見:**
- マルチエージェント討論はあらゆるモデル規模で有効
- **思考の多様性が推論を強化する**
- 数学的推論タスクで最も効果が大きい
- **4ラウンドの議論後、多様な中規模モデル群がGPT-4を上回った**
  - 多様なモデル群: GSM-8K で **91%** 精度
  - Gemini-Pro 3インスタンス: **82%** 精度

**connpute-gikai への意味:**
異なるプロバイダのモデルを混在させる設計は、この研究によって強く裏付けられている。同じモデルの複数インスタンスよりも、異なるモデルの組み合わせの方が優れた結果を出す。

**参考:** https://arxiv.org/abs/2410.12853

---

### 2.3 LLMエージェントは本当に議論できるか

**"Can LLM Agents Really Debate? A Controlled Study of Multi-Agent Debate in Logical Reasoning"**
Wu et al., 2025

Knight-Knave-Spy 論理パズルを用いた制御実験で、MADの構造的・認知的要因を体系的に検証。

**検証された6要因:**
1. エージェントのチームサイズ
2. チーム構成（同質 vs 異質）
3. 確信度の可視性
4. 討論の順序
5. 討論の深さ
6. タスクの難易度

**主要知見:**
- 内在的な推論強度とグループの多様性が討論成功の支配的要因
- 順序や確信度の可視性などの構造的パラメータは限定的な効果
- 単純な多数決が標準的なMADの性能向上の大部分を達成
- 討論ラウンドは的を絞ったバイアスルールや異質性がない限り、わずかな追加効果しかない

**推奨される設計原則:**
1. 最良のLLMを使用して内在的推論強度を最大化
2. バランスの取れた異質なチームを使用（多様性は適度に、極端は避ける）
3. 討論の深さは安定性が求められない限り1パスに制限
4. 確信度はデフォルトで非表示（過信カスケードを防止）
5. 明示的な賛否表明と理由付けを促進
6. 初期条件で自明でない意見の不一致を確保

**参考:** https://arxiv.org/abs/2511.07784

---

### 2.4 異種マルチエージェント討論 (A-HMAD)

**"Adaptive Heterogeneous Multi-Agent Debate"**
2025

既存のMADは同種のエージェントと単純多数決に限定されていたが、A-HMAD は多様な専門エージェントと動的な討論メカニズムを導入。「心の社会 (society of minds)」アプローチにより、数学的推論の改善と事実性幻覚の低減を報告。

**参考:** https://link.springer.com/article/10.1007/s44443-025-00353-3

---

## 3. 議論の失敗モード: 忖度・同調問題

マルチエージェント討論の最大の課題は、エージェント間の忖度 (sycophancy) と同調圧力 (conformity) である。

### 3.1 忖度 (Sycophancy)

**定義:** エージェントが事実の正確さや独自の分析よりも、他のエージェントへの同意を優先する傾向。

**原因:** RLHF（人間のフィードバックからの強化学習）トレーニングで「合意」が報酬として強化されているため。人間の評価者も、説得的に書かれた追従的回答を正しい回答よりも好む傾向がある。

**"Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate"**
Pitre et al., 2025

- 討論が進むにつれてエージェントの不同意率が低下
- この低下は性能劣化と相関

**参考:** https://arxiv.org/html/2509.23055v1

### 3.2 多数派の暴政 (Tyranny of the Majority)

**"Theoretical Properties and Effects of Opinion Diversity"**
Estornell & Liu, 2024

- 多数派が同じ答えを持つと、その正誤に関わらず少数派が同調
- エコーチェンバー効果の発生
- 正しい少数派が、高い妥当性の論拠に触れない限り、多数派を覆すことはまれ

### 3.3 集団思考 (Groupthink)

**Weng, Chen & Wang, 2024**

- LLMは同調バイアスを示し、反対意見を抑制
- 個別に判断した方が良い意思決定ができるケースも存在
- Janis (1982) の集団思考理論がLLMにも適用可能

### 3.4 有害な同意 (Toxic Agreement)

エージェントが有害なコンテンツを相互に増幅する現象。有害な出力をミラーリングし、強化ループを形成する。直接的なコピーメカニズムによる内容レベルの障害。

### 3.5 回答の交換 (Answer Swapping)

LLM討論でエージェントが批判的評価を行わず、互いの回答を単純にコピー・交換する現象。

**参考:**
- 失敗モードの包括的分析: https://arxiv.org/html/2509.05396v2
- ICLR 2024 忖度理解: https://proceedings.iclr.cc/paper_files/paper/2024/file/0105f7972202c1d4fb817da9f21a9663-Paper-Conference.pdf

---

## 4. 緩和手法

### 4.1 CONSENSAGENT (Pitre et al., ACL 2025)

エージェント間の相互作用に基づいてプロンプトを動的に調整し、忖度を緩和するフレームワーク。

- 単一エージェントおよび多エージェントのベースラインを上回り、全ベンチマークで SOTA を達成
- 構造化されたプロンプト最適化の重要性を実証

**参考:** https://aclanthology.org/2025.findings-acl.1141/

### 4.2 回答の匿名化 (Choi et al., 2025)

回答元を匿名化することで、アイデンティティ駆動の忖度・自己バイアスをほぼ完全に排除。

- 複数のモデルファミリーとベンチマークで効果を実証
- LLM Council (Karpathy) でも採用されている手法

**参考:** https://arxiv.org/pdf/2510.07517

### 4.3 ペルソナ管理とアーキテクチャ固有の保護策

戦略的なペルソナ管理とアーキテクチャ固有の保護策により、忖度を緩和しシステムのロバスト性を向上。

### 4.4 異種エージェントアーキテクチャ

異なるモデルバックボーンの使用がロバスト性を改善し、プロンプト攻撃からの回復力を向上。数学的領域では多様性が非寄与的とする以前の主張に反する結果。

### 4.5 スパース化とスコアベースフレームワーク

- 通信を「有用な」エージェントペアに制限（スパース化）
- トークンコスト **94.5% 削減** を達成しつつ精度は 2% 以内に維持
- スコアベースの意思決定メカニズムと反同調プロンプトがエラー伝播とバイアスを抑制

### 4.6 信頼ベースの討論トポロジー (CortexDebate)

**Sun et al., 2025**

McKinsey Trust Formula を適用し、討論トポロジーを動的に調整。有用でないエッジを刈り込み、過信や支配を制御。

### 4.7 段階的警戒と間隔通信 (GVIC)

**Zou et al., 2024**

エージェントを警戒スペクトルに沿って配置し、有用性と批判的評価のバランスを確保。

### 4.8 MACI の二重エントロピー最適化

- 交差エントロピーで冗長・低多様性の回答を検出
- 相互情報量でエージェント間の影響と収束を測定
- 発散スコアで一貫性を失わない範囲の生産的な不一致を維持
- 初期探索段階ではアイデアの多様性を、最終統合段階では集中的な合意を確保

---

## 5. 投票・合意形成プロトコルの比較研究

### 5.1 投票 vs 合意形成

**"Voting or Consensus? Decision-Making in Multi-Agent Debate"**
Kaesberg et al., ACL Findings 2025, University of Göttingen

7つの意思決定プロトコルを、6つのタスク（知識タスク・推論タスク）で比較。Llama 8B ベース。

**主要知見:**
- タスクの種類によって最適な方式が異なる
- 知識タスクと推論タスクで異なるプロトコルが有利

**参考:** https://aclanthology.org/2025.findings-acl.606.pdf

### 5.2 討論 vs 投票

**"Debate or Vote: Which Yields Better Decisions in Multi-Agent Decision-Making?"**
2025

**核心的な問い:** 多エージェント討論の効果は、討論そのものから来るのか、それとも単に複数の回答を集約しているだけなのか。

**知見:**
- 単純多数決だけで観察される改善の大部分を獲得できる
- 討論自体は信念を体系的に改善も悪化もさせない
- 信念の変化は確率的な相互影響によって駆動される

**connpute-gikai への意味:**
討論ラウンドの価値を過大評価しないこと。ただし、議事録の生成や思考プロセスの可視化という副次的価値は大きい。

**参考:** https://arxiv.org/pdf/2508.17536

### 5.3 LLMの投票行動

**"LLM Voting: Human Choices and AI Collective Decision Making"**
2024, AAAI AIES

GPT-4 と LLaMA-2 の投票行動を人間と比較。

**知見:**
- LLMには選好多様性と正確性のトレードオフが存在
- 人間の多様な選好に比べ、LLMはより均一な選択を行う傾向
- LLMを投票支援に使用すると集合的結果が均質化する可能性

**参考:** https://arxiv.org/html/2402.01766v1

### 5.4 欧州議会の投票行動シミュレーション

**"Persona-driven Simulation of Voting Behavior in the European Parliament with Large Language Models"**
2025

- ペルソナプロンプトによる個別投票の予測を検証
- ゼロショットペルソナプロンプティングで限定的な情報からでも投票を予測可能
- LLMは一貫して「進歩的・左寄り」バイアスを示す

**参考:** https://arxiv.org/abs/2506.11798

---

## 6. connpute-gikai への設計示唆

### 6.1 研究に裏付けられた設計決定

| 設計項目 | 現行設計 | 研究による裏付け |
|---------|---------|-----------------|
| 異なるプロバイダのモデル混在 | 6種のモデル | Hegazy et al.: 多様なモデル群が同種インスタンスを上回る |
| 党派制による意見対立 | 4党 | ChatEval: 多様なロールが性能に重要 |
| 複数の採決方式 | ranked / majority / consensus | Kaesberg et al.: タスクにより最適方式が異なる |
| 議長 (Opus 4.5) の高品質モデル使用 | Claude Code Pro | Wu et al.: 内在的推論強度が成功の支配的要因 |

### 6.2 研究を踏まえた設計改善案

#### (A) 忖度防止メカニズム

1. **反論義務化**: 第2読会で各議員に必ず1つ以上の反論を要求するシステムプロンプト
2. **反同調プロンプト**: 「多数派の意見に同調する必要はありません。独自の分析に基づいて判断してください」を各議員のプロンプトに注入
3. **少数意見保護**: 議長が少数派の論拠を明示的に取り上げ、多数派に再検討を促す

#### (B) 匿名化

1. **反論ラウンドでの匿名化**: 「ある議員が述べた意見」として発言元のモデル名・党名を隠す
2. **採決時の匿名解除**: 最終投票結果は党名・モデル名を含めて記録

#### (C) 対立度パラメータ (SocraSynth 由来)

```yaml
contentiousness:
  first_reading: 0.8    # 高い対立度: 独自の立場を強く主張
  second_reading: 0.6   # 中程度: 反論しつつも妥協点を探る
  amendment: 0.3         # 低い対立度: 協調的に修正案を検討
```

- temperature パラメータと連動させる
- 高い対立度 = 高い temperature = より大胆な発言
- 低い対立度 = 低い temperature = より合理的・協調的な発言

#### (D) 議論ラウンド数の最適化

Wu et al. の知見を踏まえ、デフォルトのラウンド数を調整:

- 現行設計: max_rounds = 5
- **推奨変更: max_rounds = 3, min_rounds = 2**
- 研究は「安定性が求められない限り1パスで十分」と示唆しているが、議事録の充実と思考プロセスの可視化という副次的価値を考慮して2-3ラウンドを推奨

#### (E) 議論の価値測定

「討論 vs 投票」研究の知見を踏まえ、議論が本当に結果を改善しているかを測定する仕組み:

- 第1読会の投票結果と最終投票結果を比較
- 意見変更の理由を記録
- 各ラウンドでの論点の深化度を議長が評価

### 6.3 connpute-gikai の独自性（先行研究との差別化）

| 特徴 | LLM Council | SocraSynth | AI-Parliament | **connpute-gikai** |
|------|------------|------------|---------------|-------------------|
| 党派制 | なし | なし（2極対立） | あり | **あり（複数党）** |
| 議会プロトコル | なし | 2フェーズ | 簡易 | **読会制・修正協議** |
| 議事録自動生成 | なし | なし | なし | **あり（構造化MD）** |
| 採決方式 | 合意のみ | 人間判断 | Yes/No | **3方式選択可能** |
| 対立度制御 | なし | あり | なし | **あり（段階的）** |
| 忖度防止 | 匿名化のみ | なし | なし | **複合的対策** |
| Agent + API ハイブリッド | API のみ | API のみ | API のみ | **Agent議長 + API議員** |
| コスト構造 | 全員有料API | 全員有料API | 全員有料API | **議長はPro内無料** |

---

## 7. 参考文献一覧

### プロジェクト・実装

1. Karpathy, A. (2025). *LLM Council*. GitHub. https://github.com/karpathy/llm-council
2. Chan, C.-M. et al. (2023). *ChatEval: Towards Better LLM-based Evaluators through Multi-Agent Debate*. arXiv:2308.07201. https://github.com/thunlp/ChatEval
3. InstaDeep. *DebateLLM*. GitHub. https://github.com/instadeepai/DebateLLM
4. Council AI. https://council-ai.app/

### 学術論文: マルチエージェント討論

5. Liang, T. et al. (2024). *Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate*. EMNLP 2024. https://aclanthology.org/2024.emnlp-main.992/
6. Hegazy, M. et al. (2024). *Diversity of Thought Elicits Stronger Reasoning Capabilities in Multi-Agent Debate Frameworks*. arXiv:2410.12853. https://arxiv.org/abs/2410.12853
7. Wu, Y. et al. (2025). *Can LLM Agents Really Debate? A Controlled Study of Multi-Agent Debate in Logical Reasoning*. arXiv:2511.07784. https://arxiv.org/abs/2511.07784
8. Chang, E. Y. (2024). *SocraSynth: Multi-LLM Reasoning with Conditional Statistics*. arXiv:2402.06634. https://arxiv.org/abs/2402.06634
9. *Adaptive Heterogeneous Multi-Agent Debate (A-HMAD)*. (2025). Journal of King Saud University. https://link.springer.com/article/10.1007/s44443-025-00353-3
10. *AI-Parliament*. IRJMETS. https://www.irjmets.com/upload_newfiles/irjmets71100140692/paper_file/irjmets71100140692.pdf

### 学術論文: 投票・合意形成

11. Kaesberg, J. et al. (2025). *Voting or Consensus? Decision-Making in Multi-Agent Debate*. ACL Findings 2025. https://aclanthology.org/2025.findings-acl.606.pdf
12. *Debate or Vote: Which Yields Better Decisions in Multi-Agent Decision-Making?* (2025). arXiv. https://arxiv.org/pdf/2508.17536
13. *LLM Voting: Human Choices and AI Collective Decision Making*. (2024). AAAI AIES. https://arxiv.org/html/2402.01766v1
14. *Persona-driven Simulation of Voting Behavior in the European Parliament*. (2025). arXiv:2506.11798. https://arxiv.org/abs/2506.11798

### 学術論文: 忖度・同調問題と緩和

15. Pitre, A. et al. (2025). *Peacemaker or Troublemaker: How Sycophancy Shapes Multi-Agent Debate*. arXiv:2509.23055. https://arxiv.org/html/2509.23055v1
16. Pitre, A. et al. (2025). *CONSENSAGENT: Towards Efficient and Effective Consensus in Multi-Agent LLM Interactions Through Sycophancy Mitigation*. ACL Findings 2025. https://aclanthology.org/2025.findings-acl.1141/
17. Choi, J. et al. (2025). *Measuring and Mitigating Identity Bias in Multi-Agent Debate via Anonymization*. arXiv:2510.07517. https://arxiv.org/pdf/2510.07517
18. *Talk Isn't Always Cheap: Understanding Failure Modes in Multi-Agent Debate*. (2025). arXiv:2509.05396. https://arxiv.org/html/2509.05396v2
19. *Towards Understanding Sycophancy in Language Models*. ICLR 2024.
20. Weng, Y., Chen, Z., & Wang, X. (2024). *LLM Conformity Bias in Multi-Agent Systems*.

### 学術論文: 社会的影響・集合知

21. Song, T. et al. (2024). *Multi-Agents are Social Groups: Investigating Social Influence of Multiple Agents in Human-Agent Interactions*. arXiv:2411.04578. https://arxiv.org/abs/2411.04578
22. *AI-enhanced Collective Intelligence*. (2024). ScienceDirect. https://www.sciencedirect.com/science/article/pii/S2666389924002332
23. *Multi-Agent Collaboration Mechanisms: A Survey of LLMs*. (2025). arXiv:2501.06322. https://arxiv.org/pdf/2501.06322
